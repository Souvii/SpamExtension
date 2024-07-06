function detectSpam(emailContent) {
    const spamKeywords = ["win money", "free", "urgent", "click here"];
    return spamKeywords.some(keyword => emailContent.toLowerCase().includes(keyword));
  }
  
  function injectSpamWarning(emailDetails) {
    if (detectSpam(emailDetails.content)) {
      const warningMessage = `Spam detected! Sender: ${emailDetails.sender}`;
      alert(warningMessage); // For simplicity, using alert
      // Better approach: Inject this message into the Gmail UI
    }
  }
  