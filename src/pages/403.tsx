import { history, useIntl } from '@umijs/max';
import { Button, Result } from 'antd';
import React from 'react';

const UnauthorizedPage: React.FC = () => (
  <Result
    status="403"
    title="403"
    subTitle={useIntl().formatMessage({ id: 'pages.403.subTitle' })}
    extra={
      <Button type="primary" onClick={() => history.push('/')}>
        {useIntl().formatMessage({ id: 'pages.404.buttonText' })}
      </Button>
    }
  />
);

export default UnauthorizedPage;
