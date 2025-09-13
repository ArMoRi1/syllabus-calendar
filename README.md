# Syllabus Calendar

A smart web application that automatically converts syllabus documents into organized calendar events. Built for the LawBandit internship challenge, this tool streamlines academic planning by extracting assignments, deadlines, and important dates from syllabi and transforming them into an interactive calendar interface.

## Live Demo

**Deployed App:** https://syllabus-calendar-six.vercel.app/  
**GitHub Repository:** https://github.com/ArMoRi1/syllabus-calendar/

## Features

### Core Functionality
- **PDF Upload Support**: Upload syllabus PDF files for automatic processing
- **Text Input Option**: Paste syllabus text directly for quick conversion
- **AI-Powered Extraction**: Uses OpenAI GPT-4 to intelligently parse dates and events
- **Smart Event Categorization**: Automatically categorizes events into 7 types:
  - **Meetings** - Classes, lectures, office hours
  - **Deadlines** - Assignment due dates, submission deadlines
  - **Events** - Workshops, seminars, presentations
  - **Appointments** - Scheduled visits, consultations
  - **Tasks** - Projects, milestones, action items
  - **Legal** - Court dates, hearings, filings (perfect for LawBandit!)
  - **Other** - General reminders and miscellaneous items

### User Interface
- **Dual View Modes**: Switch between calendar and list views
- **Clean, Modern Design**: Built with Tailwind CSS for responsive layout
- **Interactive Calendar**: Visual calendar with color-coded event types
- **Detailed Event Cards**: Rich event information with descriptions and categories
- **Real-time Processing**: Instant feedback during PDF parsing and analysis

### Technical Highlights
- **Multiple PDF Processing Methods**: Fallback parsing ensures maximum compatibility
- **Date Intelligence**: Handles various date formats and academic year logic
- **Error Handling**: Comprehensive error recovery and user feedback
- **TypeScript**: Full type safety throughout the application
- **Modern React**: Uses React 19 with hooks and functional components

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4
- **AI Integration**: OpenAI GPT-4 API
- **PDF Processing**: pdf-parse, pdfjs-dist
- **Icons**: Lucide React
- **Deployment**: Vercel
- **Development**: ESLint, PostCSS

## Prerequisites

Before running this project, make sure you have:

- Node.js 18+ installed
- npm or yarn package manager
- OpenAI API key

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/ArMoRi1/syllabus-calendar/
cd syllabus-calendar
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Run Development Server
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 5. Build for Production
```bash
npm run build
npm start
```

## How to Use

### Method 1: PDF Upload
1. Click "Choose File" and select your syllabus PDF
2. Click "Parse Syllabus" to begin processing
3. Wait for AI analysis to complete
4. View extracted events in calendar or list format

### Method 2: Text Input
1. Click "Switch to Text Input" tab
2. Paste your syllabus text into the text area
3. Click "Parse Syllabus" to process
4. Review and organize the extracted events

### Viewing Options
- **Calendar View**: Monthly calendar with color-coded events
- **List View**: Chronological list with detailed event information
- **Event Filtering**: Click on event types to filter by category

## Project Structure

```
syllabus-calendar/
├── src/
│   ├── app/
│   │   ├── api/           # API routes (if any)
│   │   ├── components/    # React components
│   │   ├── lib/          # Utility libraries
│   │   ├── types/        # TypeScript type definitions
│   │   ├── utils/        # Helper functions
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Main page component
├── public/               # Static assets
├── package.json         # Dependencies and scripts
├── next.config.ts       # Next.js configuration
├── tailwind.config.js   # Tailwind CSS config
└── README.md           # This file
```

## My Approach

### Problem Analysis
The challenge was to create a tool that could intelligently parse academic syllabi and convert scheduling information into a usable calendar format. This required solving several technical challenges:

1. **PDF Text Extraction**: Handling various PDF formats and structures
2. **Date Recognition**: Parsing multiple date formats and academic contexts
3. **Event Classification**: Intelligently categorizing different types of academic events
4. **User Experience**: Creating an intuitive interface for both input and output

### Solution Architecture

#### 1. Multi-Modal Input Processing
I implemented dual input methods to maximize usability:
- **PDF Processing**: Using multiple parsing libraries with fallback mechanisms
- **Text Input**: Direct paste option for maximum flexibility

#### 2. AI-Powered Analysis
Instead of regex-based parsing, I chose OpenAI's GPT-4 for:
- Natural language understanding of syllabus content
- Context-aware date extraction
- Intelligent event categorization
- Handling of academic-specific terminology

#### 3. Smart Date Logic
The application includes academic year intelligence:
- Fall semester dates (Sep-Dec) map to current year
- Spring semester dates (Jan-Aug) map to following year
- Handles relative dates and academic calendar context

#### 4. Robust Error Handling
- Multiple PDF parsing attempts with different methods
- Graceful degradation when AI analysis fails
- Clear user feedback for all error states
- Comprehensive logging for debugging

### Why This Approach?

1. **Scalability**: AI-based parsing can handle diverse syllabus formats
2. **Accuracy**: Natural language processing beats rigid pattern matching
3. **User-Friendly**: Multiple input methods accommodate different workflows
4. **Maintainable**: Clean TypeScript architecture with proper separation of concerns
5. **Future-Proof**: Easy to extend with additional features like Google Calendar sync

## Impact on LawBandit

This tool directly addresses pain points for law students and legal professionals:

- **Academic Planning**: Law students can quickly organize course schedules
- **Deadline Management**: Critical for legal coursework and case deadlines
- **Professional Development**: Easily track CLE courses and legal seminars
- **Client Communication**: Convert legal document deadlines into calendar format

The categorization system specifically includes "Legal" events, making it immediately useful for LawBandit's target audience.

## Deployment

### Vercel Deployment (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
npm run deploy

# Or for preview deployment
npm run deploy:preview
```

### Environment Variables
Make sure to set your OpenAI API key in Vercel dashboard:
- Go to Project Settings → Environment Variables
- Add `OPENAI_API_KEY` with your API key value

## Future Enhancements

- **Google Calendar Integration**: Direct sync with Google Calendar
- **Recurring Events**: Support for weekly classes and regular meetings
- **Email Notifications**: Automated reminders for upcoming deadlines
- **Multi-Language Support**: Parse syllabi in different languages
- **Collaborative Features**: Share calendars with classmates or colleagues
- **Mobile App**: React Native version for mobile access

## Known Issues & Limitations

- PDF parsing may struggle with heavily formatted or image-based documents
- Date recognition depends on standard academic calendar assumptions
- OpenAI API calls require internet connectivity
- Large PDF files may experience slower processing times

## Contributing

While this is a contest submission, feedback and suggestions are welcome! Feel free to open issues or reach out with ideas for improvement.

## License

This project was created for the LawBandit internship challenge. Please respect the contest guidelines and original work.

## Contact

**Developer**: Artem Mochalov  
**Email**: artemmochalov445@gmail.com  
**Contest Submission**: LawBandit Internship Challenge - Syllabus Calendar Feature

---

**Submission Date**: September 2025  
**Contest**: LawBandit Internship Challenge  
**Feature**: Syllabus → Calendar Conversion Tool
