const ENV = { ...process.env, ...window['env'] };

const envConfig = {
  reCaptchaKey: ENV.REACT_APP_SITE_KEY || '6LdcMO4qAAAAAImNBNufpkw6wQTCeu-pfYZAKWap',
  googleClientId:
    ENV.REACT_APP_GOOGLE_CLIENT_ID ||
    '413586944281-dcb5psdo92s8ch6ee66a4uoaf82s3gja.apps.googleusercontent.com',
};
export default envConfig;
