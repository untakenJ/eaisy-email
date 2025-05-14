import React, { useState } from 'react';

function App() {
  const [emailAddr, setEmailAddr] = useState('');
  const [toknow, setToKnow] = useState('');
  const [todo, setToDo] = useState('');
  const [generatedEmailSubject, setGeneratedEmailSubject] = useState('');
  const [generatedEmailContent, setGeneratedEmailContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);


  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toknow, todo })
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
          content: generatedEmailContent
        })
      });
      if (!translationRes.ok) throw new Error('Error translating email');
      const translationData = await translationRes.json();
      
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: "[EAIsyEmail" + (emailAddr ? ` - Reply to: ${emailAddr}` : '') + "] " + (translationData ? generatedEmailSubject + " (" + translationData.subject_translation + ")" : ''),
          emailBody: generatedEmailContent + (emailAddr ? `\n\nReply to: ${emailAddr}` : '') + "\n\n" + translationData.content_translation
        })
      });
      if (!res.ok) throw new Error('Error sending email');
      await res.json();
      alert("Email sent successfully!");
    } catch (err) {
      console.error('Failed to send email:', err);
      alert("Failed to send email. Please check the console for details.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Email Lingze eAIsily!</h1>
      <p className="mb-4 text-gray-400">
        Please answer the following questions in any language! You don't need to think about how to make the email organized or polite. Just write down anything you'd like to share with me!
      </p>

      <h3 className="mb-4">What's your email address? (I need to know this in order to reply. You may leave this blank if you want to be anonymous.)</h3>
      <input
        className="border border-gray-300 rounded w-full p-2 mb-4"
        type="text"
        placeholder="Your email address"
        value={emailAddr}
        onChange={e => setEmailAddr(e.target.value)}
        disabled={isGenerating || isSending}
      />

      <h3 className="mb-4">What do you want me to know? (Feel free to include your name!)</h3>
      <textarea
        className="border border-gray-300 rounded w-full p-2 mb-4"
        rows="3"
        placeholder="What do you want me to know?"
        value={toknow}
        onChange={e => setToKnow(e.target.value)}
        disabled={isGenerating || isSending}
      />

      <h3 className="mb-4">What do you want me to do?</h3>
      <textarea
        className="border border-gray-300 rounded w-full p-2 mb-4"
        rows="3"
        placeholder="What do you want me to do?"
        value={todo}
        onChange={e => setToDo(e.target.value)}
        disabled={isGenerating || isSending}
      />

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
