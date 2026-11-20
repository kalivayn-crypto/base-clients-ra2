/* Base de clients RA2 — dades.
   RAW conserva cada registre tal com venia a la columna A de l'Excel.
   PEOPLE és la mateixa informació, ja separada en camps. */
window.DB = (() => {
  const HEADER = '| Nombre y Apellidos | Edad | Datos Demográficos | Entorno Personal | Entorno Profesional | Rol Personal y Profesional | Retos y Necesidades Personal y Profesional | Inquietudes y Obstáculos Personales y Profesionales |';

  const RAW = [
    '| Alberto Pérez | 27 | Hombre, Soltero | Centro urbano | Programador de software | Soltero, Programador | Innovación tecnológica, Presión por proyectos, Estabilidad emocional |',
    '| Ana Rodríguez | 29 | Mujer, Soltera | Ciudad | Abogada en un bufete | Soltera, Abogada | Litigios importantes, Carga de trabajo, Responsabilidades legales |',
    '| Carlos Martínez | 42 | Hombre, Divorciado | Zona rural | Agricultor independiente | Padre, Agricultor | Crecimiento del negocio, Problemas financieros, Aislamiento rural |',
    '| David Sánchez | 45 | Hombre, Casado | Suburbio | Contador en una empresa | Padre, Contador | Balance trabajo-familia, Estrés laboral, Expectativas de la familia |',
    '| Elena García | 40 | Mujer, Casada | Zona residencial | Dueña de restaurante | Madre, Empresaria de restaurante | Éxito del negocio, Competencia en el sector, Problemas financieros |',
    '| Javier González | 38 | Hombre, Casado | Zona urbana | Gerente de ventas | Padre, Gerente de ventas | Cumplimiento de objetivos, Presión por resultados, Conciliación familiar |',
    '| Juan Pérez | 28 | Hombre, Soltero | Ciudad | Empleado de oficina | Padre, Asistente | Equilibrio trabajo-vida, Estrés, Falta de experiencia en liderazgo |',
    '| Laura López | 30 | Mujer, Soltera | Ciudad | Diseñadora gráfica | Soltera, Diseñadora | Creatividad, Competencia en el mercado, Presión de plazos |',
    '| María García | 35 | Mujer, Casada | Suburbio | Profesora en escuela | Madre, Docente | Conciliar horarios, Problemas familiares, Carga de trabajo |',
    '| Marta Fernández | 31 | Mujer, Soltera | Ciudad | Médico en hospital | Soltera, Médico | Atención a pacientes, Larga jornada laboral, Estrés emocional |',
    '| Natalia Torres | 34 | Mujer, Casada | Zona residencial | Psicóloga clínica | Madre, Psicóloga | Terapia de pacientes, Conciliación familiar, Actualización profesional |',
    '| Sergio Rodríguez | 37 | Hombre, Soltero | Ciudad | Ingeniero de software | Soltero, Ingeniero | Desarrollo de software, Presión por proyectos, Equilibrio vida personal |',
    '| Laura Martínez | 29 | Mujer, Soltera | Ciudad | Periodista | Soltera, Periodista | Investigación de noticias, Jornadas largas, Competencia en el sector |',
    '| Carlos Sánchez | 33 | Hombre, Casado | Suburbio | Enfermero en hospital | Padre, Enfermero | Atención a pacientes, Conciliación familiar, Estrés laboral |',
    '| Andrea López | 36 | Mujer, Casada | Zona residencial | Contadora en empresa | Madre, Contadora | Contabilidad financiera, Equilibrio trabajo-familia, Desarrollo profesional |',
    '| Jorge Fernández | 39 | Hombre, Casado | Zona residencial | Profesor universitario | Padre, Profesor | Investigación académica, Conciliación familiar, Presión por publicaciones |',
    '| María Pérez | 25 | Mujer, Soltera | Ciudad | Diseñadora de moda | Soltera, Diseñadora | Diseño de colecciones, Competencia en la industria, Presión de plazos |',
    '| David Martínez | 32 | Hombre, Casado | Ciudad | Médico en clínica | Padre, Médico | Atención a pacientes, Conciliación familiar, Estrés laboral |',
    '| Patricia González | 41 | Mujer, Casada | Suburbio | Dueña de tienda de moda | Madre, Empresaria de moda | Éxito del negocio, Equilibrio familiar, Competencia en el mercado |',
    '| Luis Torres | 45 | Hombre, Divorciado | Zona rural | Agricultor de ganado | Padre, Agricultor | Crecimiento de la granja, Aislamiento rural, Problemas financieros |',
    '| Sofia Martínez | 26 | Mujer, Soltera | Ciudad | Psicóloga clínica | Soltera, Psicóloga | Terapia de pacientes, Balance vida personal, Actualización profesional |',
    '| Pablo Rodríguez | 31 | Hombre, Soltero | Ciudad | Abogado en bufete | Soltero, Abogado | Litigios legales, Crecimiento profesional, Competencia en el sector |',
    '| Andrea Fernández | 33 | Mujer, Casada | Suburbio | Enfermera en hospital | Madre, Enfermera | Atención a pacientes, Conciliación familiar, Estrés laboral |',
    '| Diego García | 40 | Hombre, Casado | Zona residencial | Director de empresa | Padre, Director de empresa | Éxito empresarial, Equilibrio familiar, Presión por resultados |',
    '| Valeria Pérez | 28 | Mujer, Soltera | Ciudad | Ingeniera de software | Soltera, Ingeniera | Desarrollo de software, Presión por proyectos, Competencia en el sector |',
    '| Manuel López | 37 | Hombre, Casado | Zona urbana | Profesor universitario | Padre, Profesor | Investigación académica, Conciliación familiar, Presión académica |',
    '| Carolina Martínez | 29 | Mujer, Soltera | Ciudad | Periodista | Soltera, Periodista | Investigación de noticias, Jornadas largas, Competencia en el sector |',
    '| Jorge Sánchez | 44 | Hombre, Casado | Suburbio | Contador en empresa | Padre, Contador | Contabilidad financiera, Equilibrio trabajo-familia, Desarrollo profesional |',
    '| Laura González | 30 | Mujer, Casada | Ciudad | Médico en clínica | Madre, Médico | Atención a pacientes, Conciliación familiar, Estrés laboral |',
    '| Daniel Fernández | 35 | Hombre, Soltero | Ciudad | Diseñador gráfico | Soltero, Diseñador | Creatividad, Competencia en el mercado, Presión de plazos |'
  ];

  /* Temes: categoria nova per agrupar les preocupacions. */
  const THEMES = {
    conciliacio: 'Conciliació',
    estres: 'Estrès i pressió',
    feina: 'Contingut de la feina',
    competencia: 'Competència',
    carrera: 'Carrera professional',
    negoci: 'Negoci i resultats',
    carrega: 'Càrrega de feina',
    finances: 'Problemes financers',
    aillament: 'Aïllament rural'
  };

  /* Cada preocupació original, traduïda i assignada a un tema. */
  const T = (label, tema) => ({ label, tema });
  const TAGS = {
    innov: T('Innovació tecnològica', 'feina'),
    pproj: T('Pressió pels projectes', 'estres'),
    estab: T('Estabilitat emocional', 'estres'),
    litimp: T('Litigis importants', 'feina'),
    carrega: T('Càrrega de treball', 'carrega'),
    resp: T('Responsabilitats legals', 'feina'),
    creixneg: T('Creixement del negoci', 'negoci'),
    fin: T('Problemes financers', 'finances'),
    aill: T('Aïllament rural', 'aillament'),
    eqfam: T('Equilibri feina-família', 'conciliacio'),
    estlab: T('Estrès laboral', 'estres'),
    expfam: T('Expectatives de la família', 'conciliacio'),
    exitneg: T('Èxit del negoci', 'negoci'),
    compsec: T('Competència al sector', 'competencia'),
    obj: T("Compliment d'objectius", 'negoci'),
    pres: T('Pressió pels resultats', 'estres'),
    concfam: T('Conciliació familiar', 'conciliacio'),
    eqvida: T('Equilibri feina-vida', 'conciliacio'),
    estr: T('Estrès', 'estres'),
    lider: T("Falta d'experiència en lideratge", 'carrera'),
    creat: T('Creativitat', 'feina'),
    compmer: T('Competència al mercat', 'competencia'),
    term: T('Pressió dels terminis', 'estres'),
    horaris: T('Conciliar horaris', 'conciliacio'),
    probfam: T('Problemes familiars', 'conciliacio'),
    pac: T('Atenció als pacients', 'feina'),
    jorn: T('Jornades llargues', 'carrega'),
    estemo: T('Estrès emocional', 'estres'),
    terap: T('Teràpia de pacients', 'feina'),
    actual: T('Actualització professional', 'carrera'),
    soft: T('Desenvolupament de programari', 'feina'),
    eqpers: T('Equilibri amb la vida personal', 'conciliacio'),
    notic: T('Investigació de notícies', 'feina'),
    compt: T('Comptabilitat financera', 'feina'),
    desprof: T('Desenvolupament professional', 'carrera'),
    recerca: T('Recerca acadèmica', 'feina'),
    publi: T('Pressió per publicar', 'estres'),
    colec: T('Disseny de col·leccions', 'feina'),
    compind: T('Competència a la indústria', 'competencia'),
    granja: T('Creixement de la granja', 'negoci'),
    litleg: T('Litigis legals', 'feina'),
    creixprof: T('Creixement professional', 'carrera'),
    exitemp: T('Èxit empresarial', 'negoci'),
    eqfamiliar: T('Equilibri familiar', 'conciliacio'),
    pacad: T('Pressió acadèmica', 'estres')
  };

  const SECTORS = {
    salut: 'Salut',
    admin: 'Administració i finances',
    tec: 'Tecnologia',
    disseny: 'Disseny i moda',
    edu: 'Educació',
    dret: 'Dret',
    com: 'Comunicació',
    comerc: 'Comerç i restauració',
    direccio: 'Direcció i vendes',
    primari: 'Sector primari'
  };

  /* L'original fa servir sis noms d'entorn; aquí s'agrupen en tres tipus. */
  const ENTORNS = {
    ciutat: { label: 'Ciutat', tipus: 'urba' },
    centre: { label: 'Centre urbà', tipus: 'urba' },
    urbana: { label: 'Zona urbana', tipus: 'urba' },
    suburbi: { label: 'Suburbi', tipus: 'residencial' },
    residencial: { label: 'Zona residencial', tipus: 'residencial' },
    rural: { label: 'Zona rural', tipus: 'rural' }
  };

  /* id, fila de l'Excel, nom, cognom, edat, gènere (H/D), estat civil (S/C/D),
     fills (1/0), entorn, professió, sector, feina pròpia (1/0), preocupacions,
     i per al sector salut: rol i lloc de feina. */
  const P = (id, fila, nom, cognom, edat, g, ec, fills, entorn, prof, sector, propi, tags, salut) =>
    ({ id, fila, nom, cognom, edat, g, ec, fills, entorn, prof, sector, propi, tags, salut: salut || null });

  const PEOPLE = [
    P(1, 4, 'Alberto', 'Pérez', 27, 'H', 'S', 0, 'centre', 'Programador de programari', 'tec', 0, ['innov', 'pproj', 'estab']),
    P(2, 5, 'Ana', 'Rodríguez', 29, 'D', 'S', 0, 'ciutat', 'Advocada en un bufet', 'dret', 0, ['litimp', 'carrega', 'resp']),
    P(3, 6, 'Carlos', 'Martínez', 42, 'H', 'D', 1, 'rural', 'Agricultor autònom', 'primari', 1, ['creixneg', 'fin', 'aill']),
    P(4, 7, 'David', 'Sánchez', 45, 'H', 'C', 1, 'suburbi', 'Comptable en una empresa', 'admin', 0, ['eqfam', 'estlab', 'expfam']),
    P(5, 8, 'Elena', 'García', 40, 'D', 'C', 1, 'residencial', "Propietària d'un restaurant", 'comerc', 1, ['exitneg', 'compsec', 'fin']),
    P(6, 9, 'Javier', 'González', 38, 'H', 'C', 1, 'urbana', 'Gerent de vendes', 'direccio', 0, ['obj', 'pres', 'concfam']),
    P(7, 10, 'Juan', 'Pérez', 28, 'H', 'S', 1, 'ciutat', "Empleat d'oficina", 'admin', 0, ['eqvida', 'estr', 'lider']),
    P(8, 11, 'Laura', 'López', 30, 'D', 'S', 0, 'ciutat', 'Dissenyadora gràfica', 'disseny', 0, ['creat', 'compmer', 'term']),
    P(9, 12, 'María', 'García', 35, 'D', 'C', 1, 'suburbi', "Professora d'escola", 'edu', 0, ['horaris', 'probfam', 'carrega']),
    P(10, 13, 'Marta', 'Fernández', 31, 'D', 'S', 0, 'ciutat', 'Metgessa en un hospital', 'salut', 0, ['pac', 'jorn', 'estemo'], { rol: 'metge', lloc: 'hospital' }),
    P(11, 18, 'Natalia', 'Torres', 34, 'D', 'C', 1, 'residencial', 'Psicòloga clínica', 'salut', 0, ['terap', 'concfam', 'actual'], { rol: 'psico', lloc: null }),
    P(12, 19, 'Sergio', 'Rodríguez', 37, 'H', 'S', 0, 'ciutat', 'Enginyer de programari', 'tec', 0, ['soft', 'pproj', 'eqpers']),
    P(13, 20, 'Laura', 'Martínez', 29, 'D', 'S', 0, 'ciutat', 'Periodista', 'com', 0, ['notic', 'jorn', 'compsec']),
    P(14, 21, 'Carlos', 'Sánchez', 33, 'H', 'C', 1, 'suburbi', 'Infermer en un hospital', 'salut', 0, ['pac', 'concfam', 'estlab'], { rol: 'infermer', lloc: 'hospital' }),
    P(15, 22, 'Andrea', 'López', 36, 'D', 'C', 1, 'residencial', 'Comptable en una empresa', 'admin', 0, ['compt', 'eqfam', 'desprof']),
    P(16, 23, 'Jorge', 'Fernández', 39, 'H', 'C', 1, 'residencial', 'Professor universitari', 'edu', 0, ['recerca', 'concfam', 'publi']),
    P(17, 24, 'María', 'Pérez', 25, 'D', 'S', 0, 'ciutat', 'Dissenyadora de moda', 'disseny', 0, ['colec', 'compind', 'term']),
    P(18, 25, 'David', 'Martínez', 32, 'H', 'C', 1, 'ciutat', 'Metge en una clínica', 'salut', 0, ['pac', 'concfam', 'estlab'], { rol: 'metge', lloc: 'clinica' }),
    P(19, 26, 'Patricia', 'González', 41, 'D', 'C', 1, 'suburbi', "Propietària d'una botiga de moda", 'comerc', 1, ['exitneg', 'eqfamiliar', 'compmer']),
    P(20, 27, 'Luis', 'Torres', 45, 'H', 'D', 1, 'rural', 'Ramader', 'primari', 1, ['granja', 'aill', 'fin']),
    P(21, 32, 'Sofia', 'Martínez', 26, 'D', 'S', 0, 'ciutat', 'Psicòloga clínica', 'salut', 0, ['terap', 'eqpers', 'actual'], { rol: 'psico', lloc: null }),
    P(22, 33, 'Pablo', 'Rodríguez', 31, 'H', 'S', 0, 'ciutat', 'Advocat en un bufet', 'dret', 0, ['litleg', 'creixprof', 'compsec']),
    P(23, 34, 'Andrea', 'Fernández', 33, 'D', 'C', 1, 'suburbi', 'Infermera en un hospital', 'salut', 0, ['pac', 'concfam', 'estlab'], { rol: 'infermer', lloc: 'hospital' }),
    P(24, 35, 'Diego', 'García', 40, 'H', 'C', 1, 'residencial', "Director d'empresa", 'direccio', 0, ['exitemp', 'eqfamiliar', 'pres']),
    P(25, 36, 'Valeria', 'Pérez', 28, 'D', 'S', 0, 'ciutat', 'Enginyera de programari', 'tec', 0, ['soft', 'pproj', 'compsec']),
    P(26, 37, 'Manuel', 'López', 37, 'H', 'C', 1, 'urbana', 'Professor universitari', 'edu', 0, ['recerca', 'concfam', 'pacad']),
    P(27, 38, 'Carolina', 'Martínez', 29, 'D', 'S', 0, 'ciutat', 'Periodista', 'com', 0, ['notic', 'jorn', 'compsec']),
    P(28, 39, 'Jorge', 'Sánchez', 44, 'H', 'C', 1, 'suburbi', 'Comptable en una empresa', 'admin', 0, ['compt', 'eqfam', 'desprof']),
    P(29, 40, 'Laura', 'González', 30, 'D', 'C', 1, 'ciutat', 'Metgessa en una clínica', 'salut', 0, ['pac', 'concfam', 'estlab'], { rol: 'metge', lloc: 'clinica' }),
    P(30, 41, 'Daniel', 'Fernández', 35, 'H', 'S', 0, 'ciutat', 'Dissenyador gràfic', 'disseny', 0, ['creat', 'compmer', 'term'])
  ];

  /* Avisos de registres concrets que cal revisar. Ara mateix no n'hi ha cap. */
  const AVISOS = {};

  return { HEADER, RAW, PEOPLE, TAGS, THEMES, SECTORS, ENTORNS, AVISOS };
})();
