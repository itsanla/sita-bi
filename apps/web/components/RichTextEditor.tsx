'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (_content: string) => void;
  editable?: boolean;
}

const MenuBar = ({ editor }: { editor: ReturnType<typeof useEditor> }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b p-2 flex gap-2 flex-wrap">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
        title="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
        title="Italic"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
        title="Underline"
      >
        <UnderlineIcon size={16} />
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
        title="Bullet List"
      >
        <List size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
        title="Ordered List"
      >
        <ListOrdered size={16} />
      </button>
    </div>
  );
};

export default function RichTextEditor({
  content,
  onChange,
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: content,
    editable: editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[100px]',
      },
    },
  });

  return (
    <div
      className={`border rounded-lg overflow-hidden ${editable ? 'bg-white' : 'bg-gray-50'}`}
    >
      {editable ? <MenuBar editor={editor} /> : null}
      <EditorContent editor={editor} className="p-2" />
    </div>
  );
}
