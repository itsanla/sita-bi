import FileUpload from '../../../components/FileUpload';
import FileList from '../../../components/FileList';

export default function FileManagementPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Manajemen File</h1>
      <div className="grid gap-6">
        <FileUpload />
        <FileList />
      </div>
    </div>
  );
}
