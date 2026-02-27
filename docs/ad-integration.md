
### Entra Reader

Connects to Azure entra ID via a new app resource that uses Oauth to authenticate
We are able to read user info and get back name, phone number and email, via endpoint for human and nonhuman users the endpoint supports email initials as input.

We need these environment variable for this connection to work:

```
ENTRA_READER_AZURE_TENANT_ID
ENTRA_READER_AZURE_CLIENT_ID
ENTRA_READER_AZURE_CLIENT_SECRET
```

`ENTRA_READER_AZURE_CLIENT_SECRET` is stored in https://console.cloud.google.com/security/secret-manager/secret/ENTRA_READER_AZURE_CLIENT_SECRET/versions?project=ssbno-t-lf

The other variables can be found here - https://portal.azure.com/?l=en.en-us#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/f20f3383-d147-4039-a95b-6370cc94723b/isMSAApp~/false

Single or multiple users are capped at 20 users per call, based on microsoft graph internal limits:

- GET /entra/users/iii
- GET /entra/users/iii,yyy,stud-uuu

In test and production the variables will be supplied through nais secret manager (envFrom - secret: statreg-api-secrets)
