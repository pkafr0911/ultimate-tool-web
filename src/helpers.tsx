import { message } from 'antd';
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

export const handleCopy = (content: string, noti?: string) => {
  const unsecuredCopyToClipboard = (item: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = item;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Unable to copy to clipboard', err);
      message.error('Unable to copy to clipboard');
    }
    document.body.removeChild(textArea);
  };
  if (window.isSecureContext && navigator.clipboard) {
    navigator.clipboard.writeText(content);
  } else {
    unsecuredCopyToClipboard(content);
  }
  message.success(noti || `Copied: ${content}`);
};
