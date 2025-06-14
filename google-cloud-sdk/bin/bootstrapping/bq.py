#!/usr/bin/env python
#
# Copyright 2013 Google Inc. All Rights Reserved.
#
"""A convenience wrapper for starting bq."""

from __future__ import absolute_import
from __future__ import unicode_literals
import os

import bootstrapping

from googlecloudsdk.api_lib.iamcredentials import util as iamcred_util
from googlecloudsdk.calliope import exceptions
from googlecloudsdk.core import config
from googlecloudsdk.core import properties
from googlecloudsdk.core.credentials import gce
from googlecloudsdk.core.credentials import store


def _MaybeAddOption(args, name, value):
  if value is None:
    return
  args.append('--{name}={value}'.format(name=name, value=value))


def main():
  """Launches bq."""
  version = bootstrapping.ReadFileContents('platform/bq', 'VERSION')
  bootstrapping.CommandStart('bq', version=version)
  blocked_commands = {
      'init': 'To authenticate, run gcloud auth.',
  }
  argv = bootstrapping.GetDecodedArgv()
  bootstrapping.WarnAndExitOnBlockedCommand(argv, blocked_commands)

  cmd_args = [arg for arg in argv[1:] if not arg.startswith('-')]
  args = []
  print_logging = False
  if len(cmd_args) == 1 and cmd_args[0] == 'info':
    print_logging = True
  if cmd_args and cmd_args[0] not in ('version', 'help'):
    # Check for credentials only if they are needed.
    store.IMPERSONATION_TOKEN_PROVIDER = iamcred_util.ImpersonationAccessTokenProvider(
    )
    creds = store.Load()  # Checks if there are active credentials

    project, account = bootstrapping.GetActiveProjectAndAccount()
    if print_logging:
      print('Project:', project)
      print('Account:', account)
    adc_path = config.Paths().LegacyCredentialsAdcPath(account)
    single_store_path = config.Paths().LegacyCredentialsBqPath(account)

    if bootstrapping.GetActiveImpersonateServiceAccount():
      if print_logging:
        print('Using Oauth')
      args = ['--oauth_access_token', creds.token]
    elif gce.Metadata() and account in gce.Metadata().Accounts():
      if print_logging:
        print('Using a GCE service account')
      args = ['--use_gce_service_account']
    elif os.path.isfile(adc_path):
      if print_logging:
        print('Using an ADC path')
      args = [
          '--application_default_credential_file',
          adc_path,
          '--credential_file',
          single_store_path,
      ]
    else:
      if print_logging:
        print(
            'Falling back to p12 credentials. '
            'WARNING these are being deprecated.'
        )
      p12_key_path = config.Paths().LegacyCredentialsP12KeyPath(account)
      if os.path.isfile(p12_key_path):
        args = [
            '--service_account',
            account,
            '--service_account_credential_file',
            single_store_path,
            '--service_account_private_key_file',
            p12_key_path,
        ]
      else:
        # Don't have any credentials we can pass.
        raise store.NoCredentialsForAccountException(account)

    use_client_cert = (
        os.getenv('GOOGLE_API_USE_CLIENT_CERTIFICATE',
                  'false').upper() == 'TRUE')
    if use_client_cert:
      if print_logging:
        print('Using MTLS')
      args.append('--mtls')

    _MaybeAddOption(args, 'project_id', project)

  bootstrapping.CheckUpdates('bq')

  proxy_params = properties.VALUES.proxy
  _MaybeAddOption(args, 'proxy_address', proxy_params.address.Get())
  _MaybeAddOption(args, 'proxy_port', proxy_params.port.Get())
  _MaybeAddOption(args, 'proxy_username', proxy_params.username.Get())
  _MaybeAddOption(args, 'proxy_password', proxy_params.password.Get())
  _MaybeAddOption(args, 'disable_ssl_validation',
                  properties.VALUES.auth.disable_ssl_validation.GetBool())
  _MaybeAddOption(args, 'ca_certificates_file',
                  properties.VALUES.core.custom_ca_certs_file.Get())

  if print_logging:
    print('Complete gcloud args:', args)

  bootstrapping.ExecutePythonTool('platform/bq', 'bq.py', *args)


if __name__ == '__main__':
  bootstrapping.DisallowIncompatiblePythonVersions()
  try:
    main()
  except Exception as e:  # pylint: disable=broad-except
    exceptions.HandleError(e, 'bq')
