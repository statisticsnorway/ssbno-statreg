# AD Integration

We use AD to issue user info (name, phone number and email) for both human and nonhuman users based on AD username (initials) or email. 

Single or multiple users are capped at 20 users per call, based on microsoft graph internal limits.

## Entra Reader

Connects to Azure entra ID via a new app resource that uses Oauth to authenticate.

We need these environment variable for this connection to work:

```
ENTRA_READER_AZURE_TENANT_ID
ENTRA_READER_AZURE_CLIENT_ID
ENTRA_READER_AZURE_CLIENT_SECRET
```

In test and production the variables are supplied through nais secret manager (envFrom - secret: statreg-api-secrets)

### Local setup
The above environment variables must be set in `.env` and placeholders must be substituted as follows:

`ENTRA_READER_AZURE_CLIENT_SECRET` is found in [GCP secret manager](https://console.cloud.google.com/security/secret-manager/secret/ENTRA_READER_AZURE_CLIENT_SECRET/versions?project=ssbno-t-lf)

The other variables can be found in [Azure portal](https://portal.azure.com/?l=en.en-us#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/f20f3383-d147-4039-a95b-6370cc94723b/isMSAApp~/false)

