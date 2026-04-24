import React from 'react';

function parseMarkdown(text) {
  if (!text) return '';
  let html = text
    .replace(/### (.*?)(\n|$)/g, '<h3>$1</h3>')
    .replace(/## (.*?)(\n|$)/g, '<h2>$1</h2>')
    .replace(/# (.*?)(\n|$)/g, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^\- (.*?)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.*?)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
  return `<p>${html}</p>`;
}

export default function AIResultDisplay({ result, loading }) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-2xl p-6 mt-4 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin-slow" />
          <span className="text-indigo-300 font-medium">AI is analyzing...</span>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-indigo-800/30 rounded-full animate-pulse w-3/4" />
          <div className="h-4 bg-indigo-800/30 rounded-full animate-pulse w-1/2" />
          <div className="h-4 bg-indigo-800/30 rounded-full animate-pulse w-5/6" />
        </div>
      </div>
    );
  }

  if (!result) return null;

  const content = result.content || result;
  const model = result.model;
  const usage = result.usage;

  return (
    <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-2xl p-6 mt-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-indigo-500/20">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className="text-indigo-300 font-semibold text-sm">AI Analysis Result</h3>
          {model && <span className="text-xs text-slate-500">{model}</span>}
        </div>
        {usage && (
          <div className="ml-auto text-xs text-slate-500">
            {usage.total_tokens} tokens
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className="ai-result-content prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: parseMarkdown(typeof content === 'string' ? content : JSON.stringify(content, null, 2)) }}
      />
    </div>
  );
}
