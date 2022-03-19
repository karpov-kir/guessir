// https://anotepad.com/notes/idknwaiy

import { LexemeBuilder } from './LexemeBuilder';
import { Renderer } from './Renderer';
import { loadRemoteText } from './utils';

const _textA = `
Dear Sir / Madam ,
I read your advertisement in Students International and I would be very interested in volunteering in the sporting event you are organising . I'm a French student and I have been studying English for eight years . I have taken part in several language exchange visits to the United Kingdom , so I can communicate confidently and quite fluently in English in social situations . I also speak a little Italian and German .
I believe that I have good personal qualities which make me an effective volunteer for your event . I am outgoing and enjoy meeting people from different cultures . I have played in the college volleyball and football teams for over four years , so I am used to working with other people and encouraging them in our shared endeavours . I also have work experience in working on the front line with customers . I work at weekends in our local supermarket , which requires me to deal with customers with a pleasant attitude and liaise with other staff . I have also worked as a receptionist in a hotel in the south of France as a summer job . Here , I had to welcome guests and deal with any problems which arose . I can send you references from these employers if you need them.
Thank you for your interest in my application . I look forward to hearing from you .
`;

const _textB = `
  One tWO three
  
  Four
`;

const containerElement = document.getElementById('container') as HTMLElement;

async function boot() {
  let remoteText = '';

  try {
    const urlParams = new URLSearchParams(window.location.search);
    // It fails if the url is not correct
    const url = new URL(urlParams.get('remoteTextUrl') || '');
    remoteText = await loadRemoteText(url.href);
  } catch (error) {
    console.error(error);
  }

  const lexemeAnalysis = new LexemeBuilder().buildLexemes(remoteText || "Blob's");
  console.log(lexemeAnalysis);

  new Renderer(lexemeAnalysis, containerElement).init();
}

boot();
