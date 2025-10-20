import React from 'react';
import { history, useIntl } from '@umijs/max';
import { Button } from 'antd';
import { motion } from 'framer-motion';
import './styles.less';

const NoFoundPage: React.FC = () => {
  const intl = useIntl();

  return (
    <div className="notfound-container">
      <motion.h1
        className="notfound-title"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        404
      </motion.h1>

      <motion.p
        className="notfound-subtitle"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        {intl.formatMessage({
          id: 'pages.404.subTitle',
          defaultMessage: 'Oops! The page you are looking for does not exist.',
        })}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <Button
          type="primary"
          size="large"
          className="notfound-button"
          onClick={() => history.push('/')}
        >
          {intl.formatMessage({ id: 'pages.404.buttonText', defaultMessage: 'Go Home' })}
        </Button>
      </motion.div>
    </div>
  );
};

export default NoFoundPage;
