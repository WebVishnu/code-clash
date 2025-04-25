import React from 'react';
import MonacoEditor from '@monaco-editor/react';

export default function Editor() {
  return (
    <div className="h-screen bg-gray-900">
      <MonacoEditor
        height="100%"
        defaultLanguage="javascript"
        defaultValue="// Start coding here"
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          automaticLayout: true,
        }}
      />
    </div>
  );
}