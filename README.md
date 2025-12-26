# 📄 SummarizerBuddy

SummarizerBuddy is a full-stack web application that allows users to **paste text**, **generate summaries**, and **ask questions about the pasted document** using AI.  
No file uploads are required — everything works directly from pasted text.

---

## ✨ Features

- Paste any document or text
- Generate summaries in multiple formats:
  - Short
  - Detailed
  - Bullet points
- Choose explanation level:
  - 12-year-old
  - College student
  - Expert
- Ask questions about the pasted document
- Automatic document understanding before answering questions
- Uses Retrieval-Augmented Generation (RAG) for accurate answers

---

## 🧠 How It Works

1. User pastes a document into the text area  
2. The document is split into chunks  
3. Each chunk is converted into embeddings  
4. When a question is asked:
   - The question is embedded
   - The most relevant document chunks are retrieved
   - The AI answers using **only the retrieved document content**

The document is stored **in memory only** and is not saved to disk or a database.

---

## 🛠 Tech Stack

### Frontend
- React / Next.js
- Tailwind CSS
- Fetch API

###Images

<img width="900" height="889" alt="Screenshot 2025-12-26 133101" src="https://github.com/user-attachments/assets/35b080cb-afb1-4298-86a0-d1e57f6e08ca" />
<img width="916" height="916" alt="Screenshot 2025-12-26 133133" src="https://github.com/user-attachments/assets/60ba064e-61a9-47c1-9851-711ef6ca89e0" />
<img width="469" height="195" alt="Screenshot 2025-12-26 133212" src="https://github.com/user-attachments/assets/61943d18-90bd-457d-8aa2-fd23039f1c60" />
<img width="690" height="385" alt="Screenshot 2025-12-26 133403" src="https://github.com/user-attachments/assets/c83c836f-2d92-43f8-9f5d-a85e1128384a" />

### Backend
- Node.js
- Express
- OpenAI API
- In-memory vector storage (no database)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **OpenAI API Key** - [Get one here](https://platform.openai.com/api-keys)

---

## 📋 Setup Instructions

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd SummarizerBuddy
```

### Step 2: Backend Setup

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file:**
   ```bash
   # Create .env file in the server directory
   # Windows (PowerShell):
   New-Item .env
   
   # Mac/Linux:
   touch .env
   ```

4. **Add your OpenAI API key to `.env`:**
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```
   
   Replace `your_openai_api_key_here` with your actual API key from [OpenAI Platform](https://platform.openai.com/api-keys).

5. **Start the server:**
   ```bash
   npm start
   ```
   
   The server will start on `http://localhost:5000`
   
   > **Note:** The server runs with increased memory (4GB) to handle document processing. If you prefer to run without the memory flag, use `node index.js` instead.

### Step 3: Frontend Setup

1. **Open a new terminal window** (keep the server running)

2. **Navigate to the client directory:**
   ```bash
   cd client
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The client will start on `http://localhost:3000`

### Step 4: Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```


## ⚙️ Configuration

### Document Limits

- **Maximum document size:** 200KB
- **Maximum chunks:** 200 chunks
- **Chunk size:** 1200 characters with 200 character overlap

These limits prevent memory issues and ensure smooth operation.

### Memory Management

The server is configured to run with 4GB of memory. If you need to adjust this, edit `server/package.json`:

```json
"start": "node --max-old-space-size=4096 index.js"
```

Change `4096` to your desired memory limit in MB.

---



## 📁 Project Structure

```
SummarizerBuddy/
├── client/                 # Next.js frontend
│   ├── app/
│   │   ├── page.tsx       # Main page component
│   │   ├── layout.tsx     # Root layout
│   │   └── globals.css    # Global styles
│   ├── public/
│   │   └── bg.jpg         # Background image
│   └── package.json
│
├── server/                 # Express.js backend
│   ├── index.js           # Server entry point
│   ├── utils/
│   │   └── embeddings.js  # Embedding utilities
│   ├── .env               # Environment variables (create this)
│   └── package.json
│
└── README.md
```

---


**Happy Summarizing! 📚✨**
