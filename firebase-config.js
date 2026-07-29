'use strict';

/* ================================================================
   PREENCHA com as credenciais do SEU projeto Firebase.
   Console: https://console.firebase.google.com/
   → Configurações do projeto → Geral → "Seus apps" → app da Web
   O databaseURL só existe se você já criou um Realtime Database
   (Build → Realtime Database → Criar banco de dados).

   Essas chaves NÃO são secretas — são públicas por natureza no
   Firebase (a segurança real vem das Regras do Realtime Database,
   não de esconder esse objeto).
   ================================================================ */

const FIREBASE_CONFIG = {
  apiKey: 'COLE_AQUI_SUA_API_KEY',
  authDomain: 'SEU-PROJETO.firebaseapp.com',
  databaseURL: 'https://SEU-PROJETO-default-rtdb.firebaseio.com',
  projectId: 'SEU-PROJETO',
  storageBucket: 'SEU-PROJETO.appspot.com',
  messagingSenderId: 'SEU_SENDER_ID',
  appId: 'SEU_APP_ID',
};
