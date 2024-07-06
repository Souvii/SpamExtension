chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension Installed");
});

chrome.identity.getAuthToken({ interactive: true }, async function (token) {
  if (chrome.runtime.lastError) {
    console.log("Error obtaining OAuth token:", chrome.runtime.lastError.message);
    return;
  }

  try {
    const emails = await fetchEmails(token);
    if (emails) {
      for (const message of emails) {
        const emailDetails = await fetchEmailDetails(token, message.id);
        if (emailDetails) {
          checkForSpam(emailDetails);
        }
      }
    } else {
      console.log("No emails found.");
    }
  } catch (error) {
    console.log('Error in the authentication or fetching process:', error);
  }
});

async function fetchEmails(token) {
  try {
    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch emails: ${response.statusText}`);
    }

    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
}

async function fetchEmailDetails(token, messageId) {
  try {
    const response = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch email details: ${response.statusText}`);
    }

    const data = await response.json();
    const headers = data.payload.headers;
    const senderHeader = headers.find(header => header.name === 'From');
    let body = '';

    if (data.payload.parts) {
      const part = data.payload.parts.find(part => part.mimeType === 'text/plain');
      body = part ? part.body.data : data.payload.parts[0].body.data;
    } else {
      body = data.payload.body.data;
    }

    const emailContent = atob(body.replace(/-/g, '+').replace(/_/g, '/'));
    return {
      sender: senderHeader ? senderHeader.value : 'Unknown sender',
      content: emailContent
    };
  } catch (error) {
    console.error('Error fetching email details:', error);
    throw error;
  }
}

function checkForSpam(emailDetails) {
  const spamKeywords = ["win money", "free", "urgent", "click here"];
  const isSpam = spamKeywords.some(keyword => emailDetails.content.toLowerCase().includes(keyword));
  if (isSpam) {
    console.log(`Spam detected from ${emailDetails.sender}`);
    notifyUser(emailDetails);
  }
}

function notifyUser(emailDetails) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'components/icon1-48.png',
    title: 'Spam Detected',
    message: `Spam detected from ${emailDetails.sender}`
  });
}
