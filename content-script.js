// Palavras a pesquisar na descrição
const keywords = [
  "experience",
  "hands-on",
  "strong understanding",
  "knowledge",
  "bachelor",
  "master",
  "msc",
  "bsc",
  "phd",
  "professional experience",
  "proven experience",
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



// ===== Ponto de entrada =====
console.log("content script a correr");

let descriptionText  = getJobDescriptionText();
startDetection();


// ===== Extração de dados =====

function getJobDescriptionElement() {
  let el = document.getElementById('job-details');
  if (el) return el;

  el = document.querySelector('.jobs-description__content');
  if (el) return el;

  el = document.querySelector('[data-sdui-component="com.linkedin.sdui.generated.jobseeker.dsl.impl.aboutTheJob"]');
  return el; // null se nenhum dos três existir
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


// ===== Deteção de mudanças (observer) =====

function startDetection() {
  processText();

  const observer = new MutationObserver(processText);
  observer.observe(document.body, { childList: true, subtree: true });
}

function processText() {
  descriptionText  = getJobDescriptionText();

  if (descriptionText  && descriptionText .trim() !== "") {

    console.log(descriptionText );

    let paragraphs = descriptionText.split(/\n|; |\. /);
    let expParagraphs = paragraphs.filter(paragraph =>{

      const lowerParagraph = paragraph.toLowerCase();
      return keywords.some(keyword => lowerParagraph.includes(keyword))
    } )

    console.log("\n paragrafos de experiencia",expParagraphs)

  } else {
    console.log("Ainda não carregou / não encontrado.");
  }
}