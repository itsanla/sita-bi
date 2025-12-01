export default function UserFooter() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <p className="text-center text-xs text-gray-500">
          © {new Date().getFullYear()} SITA-BI - Politeknik Negeri Padang. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
