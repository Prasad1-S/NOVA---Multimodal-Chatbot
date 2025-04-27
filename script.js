//chatbot code

let mediaRecorder;
let audioChunks = [];
let isRecording = false;

// Store conversation history
let conversationHistory = [];

async function toggleRecording() {
  const micBtn = document.getElementById("micBtn");

  if (!isRecording) {
    // Start recording
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = event => audioChunks.push(event.data);

    mediaRecorder.onstop = async () => {
      micBtn.innerHTML = '<span class="material-symbols-outlined" style="color:#8E7DBE;position:relative;right: 15px;bottom: 6px;">mic</span>';
      micBtn.classList.remove("recording");
    micBtn.classList.add("icos");
      isRecording = false;

      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const transcription = await transcribeWithGroq(audioBlob);
      if (transcription) {
        document.getElementById("textInput").value = transcription;
      } else {
        alert("Transcription failed.");
      }
    };

    mediaRecorder.start();
    isRecording = true;
    micBtn.innerHTML = '<span class="material-symbols-outlined" style="color:#8E7DBE;position:relative;right: 15px;bottom: 6px;">pause</span>';
    micBtn.classList.add("recording");
    micBtn.classList.add("icos");

  } else {
    mediaRecorder.stop();
  }
}

async function getLLMResponse(conversationHistory) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer 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",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: conversationHistory
    })
  });

  if (response.ok) {
    const data = await response.json();
    return data.choices[0].message.content;
  } else {
    const err = await response.text();
    console.error("Groq LLM error:", err);



    return "❌ Error: Failed to get response from Groq.";
  }
}


async function transcribeWithGroq(audioBlob) {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  formData.append("model", "whisper-large-v3");
  formData.append("response_format", "text");

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer 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"
    },
    body: formData
  });

  return response.ok ? await response.text() : null;
}

async function handleSend() {
  const text = document.getElementById("textInput").value.trim();
  if (!text) return;

  addTextMessage("user", text);
  document.getElementById("textInput").value = "";

  conversationHistory.push({ role: "user", content: text });

  const maxMessages = 6;
  const limitedHistory = conversationHistory.slice(-maxMessages);

  addTextMessage("bot", "⏳ Thinking...");

  const chatResponse = await getLLMResponse(limitedHistory);

  // Replace the loading message with real response
  document.querySelector(".bot-msg:last-child").textContent = chatResponse;

  conversationHistory.push({ role: "assistant", content: chatResponse });

  // Optional: speakText(chatResponse);
}

function addTextMessage(role, content) {
  const chatBox = document.getElementById("chatBox");
  const msg = document.createElement("div");
  msg.className = `message ${role}-msg`;
  msg.textContent = content;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}


// Optional TTS (uncomment to use)
async function speakText(text) {
  const audioPlayer = document.getElementById("audioPlayer");

  const response = await fetch("https://api.groq.com/openai/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer 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"
    },
    body: JSON.stringify({
      model: "playai-tts",
      input: text,
      voice: "Celeste-PlayAI"
    })
  });

  if (response.ok) {
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    audioPlayer.src = audioUrl;
    audioPlayer.style.display = "block";
    audioPlayer.play();
  } else {
    const err = await response.text();
    console.error("TTS error:", err);
  }
}
// Function to show the selected section and hide others
function showSection(section) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(s => s.classList.remove('active'));
    document.getElementById(section).classList.add('active');
  }
  chatBox.scrollTop = chatBox.scrollHeight;


  // Web Search function
async function searchWithWeb() {
  const prompt = document.getElementById("textInput").value;
  const loadingText = document.getElementById("loading");
  const responseBox = document.getElementById("responseBox");

  responseBox.innerText = "";
  loadingText.style.display = "block";

  try {
    const response = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();
    responseBox.innerText = data.answer;
    document.getElementById('chatBox').innerText = `AI Answer: ${data.answer}`;
  } catch (err) {
    responseBox.innerText = "❌ Error: " + err.message;
    document.getElementById('chatBox').innerText = "Error fetching web results";
  } finally {
    loadingText.style.display = "none";
  }
}

  


  //vison bot code 

  // 
  
  // 

  async function processImage() {
    const fileInput = document.getElementById("imageInput");
    const question = document.getElementById("questionInput").value.trim();
    const responseBox = document.getElementById("responseBox");

    const previewCanvas = document.getElementById("previewCanvas");

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      previewCanvas.width = img.width;
      previewCanvas.height = img.height;
      previewCanvas.getContext("2d").drawImage(img, 0, 0);
      document.getElementById("previewWrapper").style.display = "block";
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

  
    if (!fileInput.files.length) {
      alert("Please upload an image.");
      return;
    }
  
    const file = fileInput.files[0];
    const base64Image = await toBase64(file);
  
    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: question || "Analyze this image & provide a short summary of it."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${file.type};base64,${base64Image}`
            }
          }
        ]
      }
    ];
  
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer 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"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: messages,
        temperature: 0.5,
        max_tokens: 1024
      })
    });
  
    const data = await response.json();
    responseBox.textContent = data.choices?.[0]?.message?.content || "No response.";
  }
  
  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // remove data: prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  const camera = document.getElementById("camera");
  const canvas = document.getElementById("cameraCanvas");
  const openCameraBtn = document.getElementById("openCamera");
  const captureBtn = document.getElementById("capturePhoto");
  const fileInput = document.getElementById("imageInput");
  
  let stream;
  
  openCameraBtn.addEventListener("click", async () => {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    camera.srcObject = stream;
    camera.style.display = "block";
    captureBtn.style.display = "inline";
  
  });
  
  captureBtn.addEventListener("click", () => {
    // Draw frame to canvas
    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;
    canvas.getContext("2d").drawImage(camera, 0, 0, canvas.width, canvas.height);
  
    // Stop video stream
    stream.getTracks().forEach(track => track.stop());
    camera.style.display = "none";
    captureBtn.style.display = "none";
  
    // Convert canvas to file-like object and trigger processImage
    canvas.toBlob(async (blob) => {
      const file = new File([blob], "captured.png", { type: "image/png" });
  
      // Simulate file upload so your existing logic works
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;
  
      // Now trigger your function
      processImage();
    }, "image/png");
  });
  


//audio bot

function setState(state) {
  const voicebott = document.getElementById('voicebott');
  voicebott.classList.remove('idle', 'listening', 'speaking');
  voicebott.classList.add(state);
}


let chatHistory = [
  { role: "system", content: "You are a friendly assistant." }
];


const recordButton = document.getElementById('recordButton');
const chatContainer = document.getElementById('chatContainer');
const audioPlayer = document.getElementById('audioPlayer');

recordButton.addEventListener('click', () => {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    startRecording();
  } else {
    stopRecording();
  }
});

async function startRecording() {
  try {
    if (isSpeaking) {
      stopSpeaking = true;
      audioPlayer.pause();
      audioPlayer.src = '';
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.start();
    setState('listening');
    recordButton.innerHTML = '<span class="material-symbols-outlined">pause_circle</span>';


    mediaRecorder.addEventListener("dataavailable", event => {
      audioChunks.push(event.data);
    });

    mediaRecorder.addEventListener("stop", async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

      try {
        const userText = await speechToText(audioBlob);
        addAudioMessage(userText, 'user');

        const botText = await generateBotReply(userText);
        addAudioMessage(botText, 'bot');

        await textToSpeech(botText);
        chatContainer.scrollTop = chatContainer.scrollHeight;
      } catch (err) {
        console.error("Error processing audio:", err);
      }
    });
  } catch (err) {
    console.error("Microphone access error:", err);
    alert("Microphone access is required.");
  }
}


function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    recordButton.innerHTML = '<span class="material-symbols-outlined">mic</span>';
  }
}

function addAudioMessage(text, sender) {
  const bubble = document.createElement('div');
  bubble.classList.add('chat-bubble', sender);
  bubble.textContent = text;
  chatContainer.appendChild(bubble);
}

async function speechToText(audioBlob) {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  formData.append("model", "distil-whisper-large-v3-en");

  try {
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': "Bearer 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"
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    const data = await response.json();
    return data.text;
  } catch (err) {
    console.error("Speech-to-Text error:", err);
    alert("Speech-to-Text Error: " + err.message);
    return "Sorry, I couldn't hear you.";
  }
}

async function generateBotReply(userInput) {
  try {
    // Add user's input to memory
    chatHistory.push({ role: "user", content: userInput });

    // Send chat history to the model
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': "Bearer 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",
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: chatHistory
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    const data = await response.json();
    const botReply = data.choices[0].message.content.trim();

    // Add bot's reply to memory
    chatHistory.push({ role: "assistant", content: botReply });

    // Optional: limit memory to last 10 user-bot exchanges
    if (chatHistory.length > 21) {
      chatHistory = [chatHistory[0], ...chatHistory.slice(-20)];
    }

    return botReply;
  } catch (err) {
    console.error("Chat Completion error:", err);
    alert("Chat Completion Error: " + err.message);
    return "I'm sorry, I couldn't think of a reply.";
  }
}

function splitText(text, maxLength = 1000) {
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
  let chunks = [];
  let currentChunk = "";

  for (let sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}


let isSpeaking = false;
let stopSpeaking = false;

async function textToSpeech(text) {
  const chunks = splitText(text, 1000);
  stopSpeaking = false;
  setState('speaking'); // Start speaking animation

  for (const chunk of chunks) {
    if (stopSpeaking) break;
    await playChunk(chunk); // Play each chunk
  }

  // Ensure the animation stays on speaking until the audio ends
  await new Promise(resolve => audioPlayer.onended = resolve); // Wait for audio to finish playing

  setState('idle'); // Set to idle once all audio has finished playing
  isSpeaking = false;
}


async function playChunk(text, retries = 3) {
  try {
    isSpeaking = true;

    const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': "Bearer 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",
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "playai-tts",
        input: text,
        voice: "Celeste-PlayAI"
      })
    });

    if (!response.ok) throw new Error(await response.text());

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    audioPlayer.src = audioUrl;
    audioPlayer.style.display = 'block';

    await new Promise((resolve, reject) => {
      audioPlayer.onended = resolve;
      audioPlayer.onerror = reject;
      audioPlayer.play();
    });

  } catch (err) {
    if (retries > 0) {
      console.warn(`TTS error, retrying... ${retries} attempts left`);
      await playChunk(text, retries - 1); // retry with one less attempt
    } else {
      console.error("TTS error after retries:", err);
      alert("Text-to-Speech Error: " + err.message);
    }
  }
}

// for toggle button

const toggle = document.getElementById("theme-toggle");

toggle.addEventListener("change", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});

// Load theme from localStorage
window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    toggle.checked = true;
  }
});


// toggle chat
const toggleBtn = document.getElementById('toggleChatBtn');
const chatcontainer = document.getElementsByClassName('chat-container');

toggleBtn.addEventListener('click', () => {
  chatContainer.classList.toggle('show');
});

// voicebot animation
document.getElementById('recordButton').addEventListener('click', () => {
  // Example: toggle between idle and listening
  setState('listening');

  // Simulate speaking after 4s and idle after 8s
  setTimeout(() => setState('speaking'), 4000);
  setTimeout(() => setState('idle'), 8000);
});


function setState(state) {
  const voicebott = document.getElementById('voicebott');
  voicebott.classList.remove('idle', 'listening', 'speaking');
  voicebott.classList.add(state);
}

setState('idle'); // sets initial state



// canvas

const video = document.getElementById('camera');
const canvass = document.getElementById('cameraCanvas');

document.getElementById('openCamera').addEventListener('click', async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  video.play();

  // Set canvas size when video starts streaming
  video.addEventListener('loadedmetadata', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.style.display = 'block';
  });
});

const viideo = document.getElementById('camera');
const cannvas = document.getElementById('cameraCanvas');
const openBtn = document.getElementById('openCamera');
const closeBtn = document.getElementById('closeCamera');
const capturePhotoo = document.getElementById('capturePhoto'); 
let streaam = null;

openBtn.addEventListener('click', async () => {
  stream = await navigator.mediaDevices.getUserMedia({ video: true });
  viideo.srcObject = stream;
  viideo.style.display = 'block';
  cannvas.style.display = 'block'; // Optional, depending on flow
  closeBtn.style.display = 'inline-block';
  openBtn.style.display = 'none';
  viideo.play();
});

closeBtn.addEventListener('click', () => {
  if (streaam) {
    streaam.getTracks().forEach(track => track.stop());
  }
  viideo.style.display = 'none';
  cannvas.style.display = 'none'; // Optional
  closeBtn.style.display = 'none';
  capturePhotoo.style.display = 'none'; // Optional
  openBtn.style.display = 'inline-block';
});
capturePhotoo.addEventListener('click', () => {
  viideo.style.display = 'none';
  cannvas.style.display = 'none'; // Optional
  closeBtn.style.display = 'none';
  capturePhotoo.style.display = 'none'; // Optional
  openBtn.style.display = 'inline-block';
});




function showPreview(sourceCanvas) {
  const ctx = previewCanvas.getContext("2d");
  previewCanvas.width = sourceCanvas.width;
  previewCanvas.height = sourceCanvas.height;
  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  ctx.drawImage(sourceCanvas, 0, 0);

  document.getElementById("previewWrapper").style.display = "block";
}

document.getElementById("cancelPreview").addEventListener("click", () => {
  document.getElementById("previewWrapper").style.display = "none";
  previewCanvas.getContext("2d").clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  fileInput.value = ""; // Reset file input
});
document.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    if (document.getElementById('chatbot').classList.contains('active')) {
      handleSend();
    } else if (document.getElementById('visionbot').classList.contains('active')) {
      // Visionbot Enter logic
      console.log('Visionbot triggered!');
    }
  }
});
