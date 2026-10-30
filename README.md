# GymBros

## Backend database configuration

Copy `backend/.env.example` to `backend/.env` and replace the placeholder with your MongoDB connection string:

```sh
cp backend/.env.example backend/.env
```

`backend/.env` is ignored by Git. Keep real credentials there locally, or configure `MONGODB_URI` as an environment variable in your deployment environment. Never commit the real connection string.