const ENV = { ...process.env, ...window['env'] };

const envConfig = {
  reCaptchaKey: ENV.REACT_APP_SITE_KEY || '6LdcMO4qAAAAAImNBNufpkw6wQTCeu-pfYZAKWap',
};
export default envConfig;
