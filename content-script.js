// Palavras a pesquisar na descrição
const keywords = [
  "experience",
  "hands-on",
  "strong understanding",
  "good understanding",
  "knowledge",
  "bachelor's", // Mudar para bachelor's
  "master's", // Mudar para master's
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
  "junior", // to remove
  "senior", // to remove
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
  // a preencher depois de inspecionares o Indeed
  return null;
}




function getJobDescriptionText() {
  const container = getJobDescriptionElement();

  if (!container) return null;

  // limpa texto "Sobre a Vaga"
  const clone = container.cloneNode(true);
  clone.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => heading.remove());

  // adiciona quebra de linha a seguir a cada elemento de bloco
  clone.querySelectorAll('p, li, div, br').forEach(el => {
    el.insertAdjacentText('afterend', '\n');
  });

  // limpa espaços/linhas em excesso
  return clone.textContent
    .split('\n')
    .map(linha => linha.trim())
    .filter(linha => linha !== '')
    .join('\n');
}


// ===== Filtragem de experiência =====

function hasKeywordMatch(paragraph) {
  const lower = paragraph.toLowerCase();
  return keywords.some(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(lower);
  });
}

// ===== Filtragem de experiência =====

function hasYearsMatch(paragraph) {
  const regex = /\d+\+?\s*years?\s+(of\s+)?[\w\s-]{0,20}experience/i;
  return regex.test(paragraph);
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

    console.log("anos de experiência (alta confiança):", yearsExpParagraphs);
    console.log("outras menções relevantes:", expParagraphs);

  } else {
    console.log("Ainda não carregou / não encontrado.");
  }
}