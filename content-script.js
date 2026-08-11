// Palavras a pesquisar na descrição
const keywordsEN = [
  "experience",
  "hands-on",
  "strong understanding",
  "good understanding",
  "knowledge",
  "bachelor's",
  "master's", 
  "degree in",
  "university degree",
  "msc",
  "bsc",
  "phd",
  "professional experience",
  "proven experience",
  "proven ability",
  "demonstrated experience",
  "track record",
  "entry level",
  "entry-level",
  "junior",
  "senior",
  "mid-level",
  "degree in",
  "diploma",
  "certification",
  "certified",
  "proficient in",
  "proficiency in",
  "familiarity with",
  "solid understanding",
  "deep understanding",
  "expertise in",
  "background in"
];

const keywordsPT = [
  "experiência",
  "prática",              // equivalente a "hands-on"
  "conhecimento",
  "licenciatura",         // "bachelor's"
  "mestrado",             // "master's"
  "licenciado(a) em",
  "mestrado em",
  "grau académico",       // "university degree"
  "formação",
  "msc",
  "bsc",
  "phd",
  "doutoramento",
  "experiência profissional",
  "experiência comprovada",  // "proven experience"
  "capacidade comprovada",   // "proven ability"
  "histórico",                // "track record"
  "júnior",
  "sénior",
  "nível intermédio",         // "mid-level"
  "diploma",
  "certificação",
  "certificado",
  "proficiência em",
  "familiaridade com",
  "conhecimento sólido",      // "solid understanding"
  "conhecimento profundo",    // "deep understanding"
  "especialização em",        // "expertise in"
  "Domínio",
];

const keywords = [...keywordsEN, ...keywordsPT];


const observer = new MutationObserver(processText);

const maxLength = 150; // ignora linhas mais longas que isto

let descriptionText;

let lastUrl = location.href;

// ===== monitorizar mudança no url =====
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    startDetection();
  }
}, 1000);



// ===== Ponto de entrada =====
console.log("content script a correr");

startDetection();



// ===== Extração de dados =====
function getJobDescriptionElement() {
  const hostname = window.location.hostname;

  if (hostname.includes('linkedin.com')) {
    return getLinkedInDescriptionElement();
  } else if (hostname.includes('indeed.com')) {
    return getIndeedDescriptionElement();
  } else if (hostname.includes('itjobs.pt')) {
    return getItJobsDescriptionElement();
  }

  return null;
}

function getLinkedInDescriptionElement() {

  let el = document.getElementById('job-details');
  if (el) return el;
  el = document.querySelector('.jobs-description__content');
  if (el) return el;
  el = document.querySelector('[data-sdui-component="com.linkedin.sdui.generated.jobseeker.dsl.impl.aboutTheJob"]');
  return el;
}

function getIndeedDescriptionElement() {
  // a preencher
  return null;
}




function getJobDescriptionText() {
  const container = getJobDescriptionElement();

  if (!container) return null;

  // limpar texto "Sobre a Vaga"
  const clone = container.cloneNode(true);
  clone.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => heading.remove());

  // adicionar quebra de linha a seguir a cada elemento de bloco
  clone.querySelectorAll('p, li, div, br').forEach(el => {
    el.insertAdjacentText('afterend', '\n');
  });

  // remover "... mais" das descrições do linkedin
  clone.querySelectorAll('button').forEach(btn => btn.remove());

  // limpar espaços/linhas em excesso
  return clone.textContent
    .split('\n')
    .map(linha => linha.trim())
    .filter(linha => linha !== '')
    .join('\n');
}


// ===== Filtragem de keywords =====

function hasKeywordMatch(paragraph) {
  const lower = paragraph.toLowerCase();
  return keywords.some(keyword => {
    const regex = new RegExp(`\\b${keyword}`, 'i');
    return regex.test(lower);
  });
}

// ===== Filtragem de experiência =====

function hasYearsMatch(paragraph) {
  const regexEN = /\d+\+?\s*years?\s+(of|in)\s+/i;
  const regexPT = /\d+\+?\s*anos?\s+(de|em)\s+/i;
  return regexEN.test(paragraph) || regexPT.test(paragraph);
}


// ===== Deteção de mudanças (observer) =====

function startDetection() {

  observer.observe(document.body, { childList: true, subtree: true });
  processText();
}


function processText() {
  descriptionText  = getJobDescriptionText();

  if (descriptionText  && descriptionText .trim() !== "") {

    console.log(descriptionText );
    
    observer.disconnect();

    let paragraphs = descriptionText.split(/\n|; |\. /);

    let yearsExpParagraphs = paragraphs.filter(p => hasYearsMatch(p.trim()));

    let expParagraphs = paragraphs.filter(paragraph =>{

      const trimmed = paragraph.trim();
      return trimmed.length <= maxLength 
          && hasKeywordMatch(trimmed)
          && !hasYearsMatch(trimmed);
    } )

    console.log("anos de experiência: ", yearsExpParagraphs);
    console.log("outras menções relevantes: ", expParagraphs);

    let summaryText = "";

    const yearsText = yearsExpParagraphs.length > 0 
      ? yearsExpParagraphs.join('\n') 
      : "nothing found";

    summaryText += "years of experience:\n" + yearsText + "\n\n";

    const otherText = expParagraphs.length > 0 
      ? expParagraphs.join('\n') 
      : "nothing found";

    summaryText += "May Also Be Relevant:\n" + otherText;

    insertSummary(summaryText);

  } else {
    console.log("Ainda não carregou / não encontrado.");
  }
}


// ===== Adicionar o resumo à página =====
function insertSummary(text) {
  const container = getJobDescriptionElement();
  if (!container) return;

  const existing = document.getElementById('my-ext-resume');
  if (existing) existing.remove();

  const summaryBox = document.createElement('div');
  summaryBox.id = 'my-ext-resume';

  summaryBox.style.cssText = `
    all: initial;
    display: block;
    font-family: Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: #1a1a1a;
    background-color: #f3f9ff;
    border: 1px solid #cfe3fa;
    border-radius: 6px;
    padding: 14px 16px;
    margin-bottom: 16px;
    white-space: pre-line;
  `;

  const label = document.createElement('div');
  label.textContent = "Extension-generated summary";
  label.style.cssText = `
    font-size: 11px;
    color: #6b7280;
    margin-bottom: 6px;
    font-style: italic;
  `;

  const content = document.createElement('div');
  content.textContent = text;

  summaryBox.appendChild(label);
  summaryBox.appendChild(content);

  container.insertAdjacentElement('beforebegin', summaryBox);
}