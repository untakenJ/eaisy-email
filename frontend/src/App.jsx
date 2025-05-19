import React, { useState, useEffect } from 'react';

function App() {
  const [formData, setFormData] = useState({});
  const [templateConfig, setTemplateConfig] = useState(null);
  const [generatedEmailSubject, setGeneratedEmailSubject] = useState('');
  const [generatedEmailContent, setGeneratedEmailContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    // Load template configuration
    fetch('/api/template-config')
      .then(res => res.json())
      .then(config => {
        setTemplateConfig(config);
        // Initialize form data
        const initialFormData = {};
        config.questions.forEach(q => {
          initialFormData[q.id] = '';
        });
        setFormData(initialFormData);
        // Update document title
        document.title = config.title;
      })
      .catch(err => console.error('Failed to load template config:', err));
  }, []);

  const handleInputChange = (id, value) => {
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          formData,
          templateConfig 
        })
      });
      if (!res.ok) throw new Error('Error generating email');
      const data = await res.json();
      setGeneratedEmailSubject(data.subject);
      setGeneratedEmailContent(data.content);
    } catch (err) {
      console.error('Failed to generate email:', err);
      alert("Failed to generate email. Please check the console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!generatedEmailContent.trim()) {
      alert("No email content to send. Please generate an email first.");
      return;
    }
    setIsSending(true);
    try {
      const translationRes = await fetch('/api/translate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: generatedEmailSubject,
          content: generatedEmailContent,
          templateConfig
        })
      });
      if (!translationRes.ok) throw new Error('Error translating email');
      const translationData = await translationRes.json();
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('subject', "[EAIsyEmail" + (formData.emailAddr ? ` - Reply to: ${formData.emailAddr}` : '') + "] " + (translationData ? generatedEmailSubject + " (" + translationData.subject_translation + ")" : ''));
      formDataToSend.append('emailBody', generatedEmailContent + (formData.emailAddr ? `\n\nReply to: ${formData.emailAddr}` : '') + "\n\n" + translationData.content_translation);
      
      // Append attachments
      attachments.forEach(file => {
        formDataToSend.append('attachments', file);
      });
      
      const res = await fetch('/api/send-email', {
        method: 'POST',
        body: formDataToSend
      });
      if (!res.ok) throw new Error('Error sending email');
      await res.json();
      alert("Email sent successfully!");
      setAttachments([]); // Clear attachments after successful send
    } catch (err) {
      console.error('Failed to send email:', err);
      alert("Failed to send email. Please check the console for details.");
    } finally {
      setIsSending(false);
    }
  };

  if (!templateConfig) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        {templateConfig.title}
      </h1>
      <p className="mb-4 text-gray-400">
        {templateConfig.welcomeMessage}
      </p>

      {templateConfig.questions.map(question => (
        <div key={question.id}>
          <h3 className="mb-4">{question.label}</h3>
          {question.type === 'textarea' ? (
            <textarea
              className="border border-gray-300 rounded w-full p-2 mb-4"
              rows={question.rows}
              placeholder={question.placeholder}
              value={formData[question.id]}
              onChange={e => handleInputChange(question.id, e.target.value)}
              disabled={isGenerating || isSending}
            />
          ) : (
            <input
              className="border border-gray-300 rounded w-full p-2 mb-4"
              type={question.type}
              placeholder={question.placeholder}
              value={formData[question.id]}
              onChange={e => handleInputChange(question.id, e.target.value)}
              disabled={isGenerating || isSending}
            />
          )}
        </div>
      ))}

      {/* File Upload Section */}
      <div className="mb-4">
        <h3 className="mb-2">Attachments (Optional)</h3>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="border border-gray-300 rounded w-full p-2"
          disabled={isGenerating || isSending}
        />
        {attachments.length > 0 && (
          <div className="mt-2">
            <h4 className="text-sm font-medium mb-2">Selected files:</h4>
            <ul className="space-y-1">
              {attachments.map((file, index) => (
                <li key={index} className="flex items-center justify-between text-sm">
                  <span>{file.name}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-red-500 hover:text-red-700"
                    disabled={isGenerating || isSending}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        className={`bg-blue-500 text-white font-semibold py-2 px-4 rounded mb-4 hover:bg-blue-600 ${(isGenerating || isSending) ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleGenerate}
        disabled={isGenerating || isSending}
      >
        {isGenerating ? 'Generating…' : 'Generate Email'}
      </button>

      <hr className="border-gray-300 my-6" />

      <div className="space-y-4" style={{ paddingBottom: '1rem' }}>
        <div className="flex items-start">
          <label className="w-24 font-medium mr-4">Subject:</label>
          <input
            type="text"
            className="border border-gray-300 rounded w-full p-2"
            placeholder="Generated email subject will appear here..."
            value={generatedEmailSubject}
            onChange={e => setGeneratedEmailSubject(e.target.value)}
            disabled={isGenerating || isSending}
          />
        </div>

        <div className="flex items-start">
          <label className="w-24 font-medium mr-4">Content:</label>
          <textarea
            className="border border-gray-300 rounded w-full p-2"
            rows="7"
            placeholder="Generated email content will appear here..."
            value={generatedEmailContent}
            onChange={e => setGeneratedEmailContent(e.target.value)}
            disabled={isGenerating || isSending}
          />
        </div>
      </div>

      <button
        className={`bg-green-500 text-white font-semibold py-2 px-4 rounded hover:bg-green-600 ${(isGenerating || isSending) ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleSend}
        disabled={isGenerating || isSending}
      > 
        {isSending ? 'Sending…' : 'Send Email'} 
      </button>
    </div>
  );
}

export default App;
