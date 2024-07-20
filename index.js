const puppeteer = require('puppeteer');
const readline = require('readline');
const TurndownService = require('turndown');

// Configuración de readline para entrada de usuario
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Función para pedir una URL al usuario
const getUrl = () => {
  return new Promise((resolve) => {
    rl.question('Ingrese la URL de Amazon: ', (url) => {
      resolve(url);
    });
  });
};

// Función principal
(async () => {
  const url = await getUrl();

  const browser = await puppeteer.launch({
    headless: true,
    slowMo: 10,
    args: [
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--unsafely-treat-insecure-origin-as-secure=http://localhost',
      '--allow-file-access-from-files',
      '--enable-usermedia-screen-capturing',
      '--allow-http-screen-capture',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-automation',
      '--disable-web-security',
      '--disable-features=CrossSiteDocumentBlockingIfIsolating,CrossSiteDocumentBlockingAlways,IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });

  const page = await browser.newPage();

  try {
    await page.goto('https://potterinsights.com', { waitUntil: 'networkidle2' });

    // Llenar el input con el link de Amazon
    const inputSelector = 'textarea#amazon-url';
    await page.waitForSelector(inputSelector, { visible: true });
    await page.type(inputSelector, url);

    // Dar clic en el botón "Let's Go"
    const buttonSelector = 'button#letsgo';
    await page.waitForSelector(buttonSelector, { visible: true });
    await page.click(buttonSelector);

    // Esperar el mensaje "PROCESSING"
    const processingSelector = 'div#status';
    await page.waitForFunction(
      (selector) => document.querySelector(selector).innerText.includes('PROCESSING'),
      {},
      processingSelector
    );
    console.log('Procesando...');

    // Esperar a que desaparezca el mensaje "PROCESSING"
    await page.waitForFunction(
      (selector) => !document.querySelector(selector).innerText.includes('PROCESSING'),
      { timeout: 0 }, // Sin límite de tiempo
      processingSelector
    );
    console.log('Procesamiento completado.');

    // Esperar 10 segundos adicionales para asegurar que el contenido se cargue completamente
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Tomar la información del contenedor de resultados
    const resultSelector = 'div#result2';
    await page.waitForSelector(resultSelector, { visible: true });
    const resultHtml = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      return element ? element.innerHTML : null;
    }, resultSelector);

    if (resultHtml) {
      // Convertir HTML a Markdown
      const turndownService = new TurndownService();
      const resultMarkdown = turndownService.turndown(resultHtml);

      console.log('Resultado en Markdown:');
      console.log(resultMarkdown);
    } else {
      console.log('No se encontró contenido en el contenedor de resultados.');
    }

  } catch (error) {
    console.error('Error durante el proceso:', error);
  }

  // Mantener el navegador abierto
  console.log('Presiona Ctrl+C para cerrar el navegador.');
  await new Promise(resolve => {
    rl.question('Presiona Enter para finalizar el script y cerrar el navegador.', () => {
      resolve();
    });
  });

  await browser.close();
})();
