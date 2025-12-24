import React from 'react';
import { Modal } from 'antd';
import { SavedProject } from '../types';
import SavedProjectsList from './SavedProjectsList';

interface ProjectModalProps {
  visible: boolean;
  onCancel: () => void;
  projects: SavedProject[];
  onLoad: (project: SavedProject) => void;
  onDelete: (id: string) => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  visible,
  onCancel,
  projects,
  onLoad,
  onDelete,
}) => {
  return (
    <Modal title="Saved Projects" open={visible} onCancel={onCancel} footer={null} width={800}>
      <SavedProjectsList projects={projects} onLoad={onLoad} onDelete={onDelete} />
    </Modal>
  );
};

export default ProjectModal;
