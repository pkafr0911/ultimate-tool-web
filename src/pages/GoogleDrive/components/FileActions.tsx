import React, { useState, useEffect } from 'react';
import {
  Modal,
  Input,
  Select,
  Form,
  Switch,
  Tree,
  Spin,
  List,
  Avatar,
  Tag,
  Typography,
  Space,
  Button,
  Popconfirm,
  message,
  Alert,
  Divider,
} from 'antd';
import {
  EditOutlined,
  CopyOutlined,
  ShareAltOutlined,
  DragOutlined,
  DeleteOutlined,
  FolderOutlined,
  UserOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { DriveFile } from '../types';
import { useDriveApi } from '../hooks/useDriveApi';
import { Permission } from '../utils/driveApi';

const { Text } = Typography;

// ─── Rename Modal ───────────────────────────────────────────────────

interface RenameModalProps {
  file: DriveFile | null;
  visible: boolean;
  onClose: () => void;
  accessToken: string | null;
  onSuccess: () => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  file,
  visible,
  onClose,
  accessToken,
  onSuccess,
}) => {
  const { rename } = useDriveApi(accessToken);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (file) setNewName(file.name);
  }, [file]);

  const handleRename = async () => {
    if (!file || !newName.trim()) return;
    setLoading(true);
    try {
      await rename(file.id, newName.trim());
      onSuccess();
      onClose();
    } catch {
      // error handled in hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Rename"
      open={visible}
      onOk={handleRename}
      onCancel={onClose}
      confirmLoading={loading}
      okText="Rename"
      destroyOnClose
    >
      <Input
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        placeholder="Enter new name"
        onPressEnter={handleRename}
        autoFocus
      />
    </Modal>
  );
};

// ─── Copy Modal ─────────────────────────────────────────────────────

interface CopyModalProps {
  file: DriveFile | null;
  visible: boolean;
  onClose: () => void;
  accessToken: string | null;
  onSuccess: () => void;
}

export const CopyModal: React.FC<CopyModalProps> = ({
  file,
  visible,
  onClose,
  accessToken,
  onSuccess,
}) => {
  const { copy } = useDriveApi(accessToken);
  const [copyName, setCopyName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (file) setCopyName(`Copy of ${file.name}`);
  }, [file]);

  const handleCopy = async () => {
    if (!file) return;
    setLoading(true);
    try {
      await copy(file.id, copyName.trim() || undefined);
      onSuccess();
      onClose();
    } catch {
      // error handled in hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Make a Copy"
      open={visible}
      onOk={handleCopy}
      onCancel={onClose}
      confirmLoading={loading}
      okText="Copy"
      destroyOnClose
    >
      <Input
        value={copyName}
        onChange={(e) => setCopyName(e.target.value)}
        placeholder="Copy name"
        onPressEnter={handleCopy}
        autoFocus
      />
    </Modal>
  );
};

// ─── Share Modal ────────────────────────────────────────────────────

interface ShareModalProps {
  file: DriveFile | null;
  visible: boolean;
  onClose: () => void;
  accessToken: string | null;
  onSuccess: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  file,
  visible,
  onClose,
  accessToken,
  onSuccess,
}) => {
  const { share, getPermissions, removePermission } = useDriveApi(accessToken);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);

  useEffect(() => {
    if (visible && file) {
      setShareLink(null);
      loadPermissions();
    }
  }, [visible, file]);

  const loadPermissions = async () => {
    if (!file) return;
    setLoadingPerms(true);
    try {
      const res = await getPermissions(file.id);
      const perms = res.permissions || [];
      setPermissions(perms);
      // If anyone permission already exists, show the share link
      const anyonePerm = perms.find((p: any) => p.type === 'anyone');
      if (anyonePerm && file.webViewLink) {
        setShareLink(file.webViewLink);
      }
    } catch {
      // ignore
    } finally {
      setLoadingPerms(false);
    }
  };

  const handleShare = async () => {
    if (!file) return;
    try {
      const values = await form.validateFields();
      setLoading(true);
      const permission: Permission = {
        role: values.role,
        type: values.type,
      };
      if (values.type === 'user' || values.type === 'group') {
        permission.emailAddress = values.email;
      }
      await share(file.id, permission, values.notify);
      form.resetFields();
      // Show shareable link for "anyone" type
      if (values.type === 'anyone' && file.webViewLink) {
        setShareLink(file.webViewLink);
      }
      loadPermissions();
      onSuccess();
    } catch {
      // validation or API error
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    if (!file) return;
    try {
      await removePermission(file.id, permissionId);
      // Check if we removed the "anyone" permission — hide link if so
      const removedPerm = permissions.find((p: any) => p.id === permissionId);
      if (removedPerm?.type === 'anyone') {
        setShareLink(null);
      }
      loadPermissions();
    } catch {
      // handled in hook
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      message.success('Link copied to clipboard');
    }
  };

  const roleColor: Record<string, string> = {
    owner: 'gold',
    writer: 'blue',
    commenter: 'green',
    reader: 'default',
  };

  return (
    <Modal
      title={`Share "${file?.name}"`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={540}
      destroyOnClose
    >
      {shareLink && (
        <Alert
          style={{ marginBottom: 16 }}
          type="success"
          icon={<LinkOutlined />}
          showIcon
          message="Anyone with this link can access the file"
          description={
            <Input.Search
              value={shareLink}
              readOnly
              enterButton="Copy"
              onSearch={handleCopyLink}
              style={{ marginTop: 8 }}
            />
          }
        />
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={{ role: 'reader', type: 'user', notify: true }}
      >
        <Form.Item name="type" label="Share with" rules={[{ required: true }]}>
          <Select>
            <Select.Option value="user">User</Select.Option>
            <Select.Option value="group">Group</Select.Option>
            <Select.Option value="anyone">Anyone with the link</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
          {({ getFieldValue }) =>
            (getFieldValue('type') === 'user' || getFieldValue('type') === 'group') && (
              <Form.Item
                name="email"
                label="Email address"
                rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
              >
                <Input placeholder="user@example.com" />
              </Form.Item>
            )
          }
        </Form.Item>

        <Form.Item name="role" label="Role" rules={[{ required: true }]}>
          <Select>
            <Select.Option value="reader">Viewer</Select.Option>
            <Select.Option value="commenter">Commenter</Select.Option>
            <Select.Option value="writer">Editor</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prev, cur) => prev.type !== cur.type}
        >
          {({ getFieldValue }) =>
            getFieldValue('type') !== 'anyone' && (
              <Form.Item name="notify" label="Send notification email" valuePropName="checked">
                <Switch />
              </Form.Item>
            )
          }
        </Form.Item>

        <Button type="primary" onClick={handleShare} loading={loading} block>
          Share
        </Button>
      </Form>

      <Divider />

      <Text strong>People with access</Text>
      {loadingPerms ? (
        <div style={{ textAlign: 'center', padding: 16 }}>
          <Spin size="small" />
        </div>
      ) : (
        <List
          size="small"
          style={{ marginTop: 8 }}
          dataSource={permissions}
          renderItem={(perm: any) => (
            <List.Item
              actions={
                perm.role !== 'owner'
                  ? [
                      <Popconfirm
                        title="Remove access?"
                        onConfirm={() => handleRemovePermission(perm.id)}
                        key="remove"
                      >
                        <Button type="text" danger size="small">
                          Remove
                        </Button>
                      </Popconfirm>,
                    ]
                  : undefined
              }
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} src={perm.photoLink} size="small" />}
                title={perm.displayName || perm.emailAddress || (perm.type === 'anyone' ? 'Anyone with the link' : perm.type)}
                description={perm.emailAddress}
              />
              <Tag color={roleColor[perm.role] || 'default'}>{perm.role}</Tag>
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
};

// ─── Move Modal ─────────────────────────────────────────────────────

interface MoveModalProps {
  file: DriveFile | null;
  visible: boolean;
  onClose: () => void;
  accessToken: string | null;
  onSuccess: () => void;
}

export const MoveModal: React.FC<MoveModalProps> = ({
  file,
  visible,
  onClose,
  accessToken,
  onSuccess,
}) => {
  const { list, move } = useDriveApi(accessToken);
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('root');
  const [loadingTree, setLoadingTree] = useState(false);

  useEffect(() => {
    if (visible) {
      loadRootFolders();
    }
  }, [visible]);

  const loadRootFolders = async () => {
    setLoadingTree(true);
    try {
      const res = await list('root');
      const folders = res.files.filter((f) => f.mimeType === 'application/vnd.google-apps.folder');
      setTreeData([
        {
          title: 'My Drive',
          key: 'root',
          children: folders.map((f) => ({
            title: f.name,
            key: f.id,
            isLeaf: false,
          })),
        },
      ]);
    } catch {
      // ignore
    } finally {
      setLoadingTree(false);
    }
  };

  const onLoadData = async (node: any) => {
    try {
      const res = await list(node.key);
      const folders = res.files.filter((f) => f.mimeType === 'application/vnd.google-apps.folder');
      const children = folders.map((f) => ({
        title: f.name,
        key: f.id,
        isLeaf: false,
      }));
      // Update tree data
      setTreeData((prev) => updateTreeData(prev, node.key, children));
    } catch {
      // ignore
    }
  };

  const updateTreeData = (list: any[], key: string, children: any[]): any[] => {
    return list.map((node) => {
      if (node.key === key) {
        return { ...node, children };
      }
      if (node.children) {
        return { ...node, children: updateTreeData(node.children, key, children) };
      }
      return node;
    });
  };

  const handleMove = async () => {
    if (!file || !selectedFolder) return;
    setLoading(true);
    try {
      await move(file.id, selectedFolder, file.parents || []);
      onSuccess();
      onClose();
    } catch {
      // error handled in hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Move "${file?.name}"`}
      open={visible}
      onOk={handleMove}
      onCancel={onClose}
      confirmLoading={loading}
      okText="Move here"
      destroyOnClose
    >
      {loadingTree ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      ) : (
        <Tree
          treeData={treeData}
          loadData={onLoadData}
          onSelect={(keys) => {
            if (keys.length > 0) setSelectedFolder(keys[0] as string);
          }}
          selectedKeys={[selectedFolder]}
          defaultExpandedKeys={['root']}
          showIcon
          icon={<FolderOutlined style={{ color: '#faad14' }} />}
          style={{ maxHeight: 400, overflow: 'auto' }}
        />
      )}
    </Modal>
  );
};

// ─── Delete Confirm ─────────────────────────────────────────────────

interface DeleteConfirmProps {
  file: DriveFile | null;
  visible: boolean;
  onClose: () => void;
  accessToken: string | null;
  onSuccess: () => void;
}

export const DeleteConfirm: React.FC<DeleteConfirmProps> = ({
  file,
  visible,
  onClose,
  accessToken,
  onSuccess,
}) => {
  const { trash } = useDriveApi(accessToken);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!file) return;
    setLoading(true);
    try {
      await trash(file.id);
      onSuccess();
      onClose();
    } catch {
      // error handled in hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Move to Trash"
      open={visible}
      onOk={handleDelete}
      onCancel={onClose}
      confirmLoading={loading}
      okText="Move to Trash"
      okButtonProps={{ danger: true }}
      destroyOnClose
    >
      <p>
        Are you sure you want to move <Text strong>"{file?.name}"</Text> to trash?
      </p>
      <Text type="secondary">You can restore it from Drive trash within 30 days.</Text>
    </Modal>
  );
};
