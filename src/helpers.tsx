import querystring from 'query-string';

//get curent params in url
export const getPrams = (ignore: string[] = []) => {
  const { ...res } = querystring.parse(location.search);
  const filtered = Object.keys(res)
    .filter((key) => !ignore.includes(key))
    .reduce((obj, key) => {
      obj[key] = res[key];
      return obj;
    }, {});

  return generateParams(filtered);
};

//obj ->> parmas
export const generateParams = (obj: any) => {
  if (Object.keys(obj).length > 0) {
    let result = '';
    Object.keys(obj).forEach((item) => {
      result += `&${item}=${obj[item]}`;
    });
    return result;
  }
  return '';
};
