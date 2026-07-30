'use strict';

/* ================================================================
   HABILIDADE QUE VENCE — fundo-3d.js
   Fundo animado em Three.js: uma constelação de partículas em
   ciano/dourado, com linhas de conexão sutis (tema "rede de
   jogadores conectados") e leve parallax pelo mouse.

   Performance e acessibilidade:
     - Pausa quando a aba fica em segundo plano.
     - Respeita prefers-reduced-motion (renderiza 1 frame estático).
     - Redimensiona com a janela.
   ================================================================ */

(() => {
  const canvas = document.getElementById('fundo-3d');
  if (!canvas || typeof THREE === 'undefined') return;

  const preferenciaMovimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 32;

  const CORES = {
    ciano: new THREE.Color('#00f2fe'),
    esmeralda: new THREE.Color('#00e676'),
    dourado: new THREE.Color('#d4af37'),
  };

  // --- Nuvem de partículas (a "constelação") ---
  const TOTAL_PARTICULAS = window.innerWidth < 720 ? 90 : 190;
  const geometriaPontos = new THREE.BufferGeometry();
  const posicoes = new Float32Array(TOTAL_PARTICULAS * 3);
  const cores = new Float32Array(TOTAL_PARTICULAS * 3);
  const paletaPartículas = [CORES.ciano, CORES.esmeralda, CORES.dourado];

  for (let i = 0; i < TOTAL_PARTICULAS; i += 1) {
    posicoes[i * 3] = (Math.random() - 0.5) * 60;
    posicoes[i * 3 + 1] = (Math.random() - 0.5) * 40;
    posicoes[i * 3 + 2] = (Math.random() - 0.5) * 40;

    const cor = paletaPartículas[i % paletaPartículas.length];
    cores[i * 3] = cor.r;
    cores[i * 3 + 1] = cor.g;
    cores[i * 3 + 2] = cor.b;
  }

  geometriaPontos.setAttribute('position', new THREE.BufferAttribute(posicoes, 3));
  geometriaPontos.setAttribute('color', new THREE.BufferAttribute(cores, 3));

  const materialPontos = new THREE.PointsMaterial({
    size: 0.42,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const pontos = new THREE.Points(geometriaPontos, materialPontos);
  cena.add(pontos);

  // --- Linhas de conexão entre partículas próximas (efeito "rede") ---
  const DISTANCIA_CONEXAO = 7.5;
  const posArray = geometriaPontos.attributes.position.array;
  const linhasPosicoes = [];

  for (let i = 0; i < TOTAL_PARTICULAS; i += 1) {
    for (let j = i + 1; j < TOTAL_PARTICULAS; j += 1) {
      const dx = posArray[i * 3] - posArray[j * 3];
      const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
      const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
      const distancia = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (distancia < DISTANCIA_CONEXAO) {
        linhasPosicoes.push(
          posArray[i * 3], posArray[i * 3 + 1], posArray[i * 3 + 2],
          posArray[j * 3], posArray[j * 3 + 1], posArray[j * 3 + 2]
        );
      }
    }
  }

  const geometriaLinhas = new THREE.BufferGeometry();
  geometriaLinhas.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linhasPosicoes), 3));
  const materialLinhas = new THREE.LineBasicMaterial({
    color: CORES.ciano, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending,
  });
  const rede = new THREE.LineSegments(geometriaLinhas, materialLinhas);
  cena.add(rede);

  // --- Dois anéis (wireframe) girando lentamente — leitura "arena" ---
  const criarAnel = (raio, cor, opacidade) => {
    const geometria = new THREE.TorusGeometry(raio, 0.045, 8, 96);
    const material = new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: opacidade, wireframe: true });
    return new THREE.Mesh(geometria, material);
  };

  const anelCiano = criarAnel(14, CORES.ciano, 0.16);
  anelCiano.rotation.x = Math.PI / 2.4;
  cena.add(anelCiano);

  const anelDourado = criarAnel(19, CORES.dourado, 0.1);
  anelDourado.rotation.x = Math.PI / 3.1;
  anelDourado.rotation.y = Math.PI / 5;
  cena.add(anelDourado);

  // --- Parallax sutil pelo mouse ---
  const alvoParallax = { x: 0, y: 0 };
  window.addEventListener('mousemove', (evento) => {
    alvoParallax.x = (evento.clientX / window.innerWidth - 0.5) * 2;
    alvoParallax.y = (evento.clientY / window.innerHeight - 0.5) * 2;
  });

  const redimensionar = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', redimensionar);

  let quadroAtivo = true;
  document.addEventListener('visibilitychange', () => {
    quadroAtivo = document.visibilityState === 'visible';
  });

  let relogio = 0;
  const animar = () => {
    if (!preferenciaMovimentoReduzido) {
      relogio += 0.0022;
      pontos.rotation.y = relogio;
      pontos.rotation.x = relogio * 0.35;
      rede.rotation.y = relogio;
      rede.rotation.x = relogio * 0.35;
      anelCiano.rotation.z += 0.0012;
      anelDourado.rotation.z -= 0.0009;

      camera.position.x += (alvoParallax.x * 3 - camera.position.x) * 0.02;
      camera.position.y += (-alvoParallax.y * 2 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);
    }

    renderer.render(cena, camera);
    if (quadroAtivo && !preferenciaMovimentoReduzido) requestAnimationFrame(animar);
  };

  animar();

  // Se o usuário pedir menos movimento, ainda assim renderiza a cena
  // parada (fundo bonito, só sem animação contínua).
  if (preferenciaMovimentoReduzido) renderer.render(cena, camera);
})();
