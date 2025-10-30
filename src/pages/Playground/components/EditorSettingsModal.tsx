import React from 'react';
import { Modal, Form, InputNumber, Space, Switch, message } from 'antd';
import { useMonacoOption } from '../hooks/useMonacoOption';

type Props = {
  open: boolean;
  onClose: () => void;
};

const EditorSettingsModal: React.FC<Props> = ({ open, onClose }) => {
  const { monacoOptions, setEditorOptions } = useMonacoOption();

  const handleSaveSettings = (values: any) => {
    setEditorOptions(values);
    onClose();
    message.success('Editor settings updated!');
  };

  return (
    <Modal
      title="Editor Settings"
      open={open}
      onCancel={onClose}
      onOk={() => document.getElementById('editor-settings-submit')?.click()}
      width={380}
      centered
    >
      <Form
        layout="vertical"
        initialValues={monacoOptions}
        onFinish={handleSaveSettings}
        id="editor-settings-form"
        style={{ marginTop: 8 }}
      >
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Form.Item label="Font Size" name="fontSize" style={{ marginBottom: 8 }}>
            <InputNumber min={10} max={30} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Line Numbers Min Chars"
            name="lineNumbersMinChars"
            style={{ marginBottom: 8 }}
          >
            <InputNumber min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Line Decorations Width"
            name="lineDecorationsWidth"
            style={{ marginBottom: 8 }}
          >
            <InputNumber min={0} max={20} style={{ width: '100%' }} />
          </Form.Item>

          <Space>
            <Form.Item
              label="Minimap"
              name="minimap"
              valuePropName="checked"
              style={{ marginBottom: 4 }}
            >
              <Switch size="small" />
            </Form.Item>
            <Form.Item
              label="Word Wrap"
              name="wordWrap"
              valuePropName="checked"
              style={{ marginBottom: 4 }}
            >
              <Switch size="small" />
            </Form.Item>
            <Form.Item
              label="Line Numbers"
              name="lineNumbers"
              valuePropName="checked"
              style={{ marginBottom: 4 }}
            >
              <Switch size="small" />
            </Form.Item>
          </Space>
        </Space>

        <button type="submit" id="editor-settings-submit" style={{ display: 'none' }} />
      </Form>
    </Modal>
  );
};

export default EditorSettingsModal;
