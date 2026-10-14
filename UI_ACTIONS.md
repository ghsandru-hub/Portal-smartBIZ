# ContaCheckCopilot — reguli UI și acțiuni

## Scop

Acest fișier păstrează regulile generale pe care utilizatorul cere explicit să le
reținem pentru lucrările viitoare. Se citește împreună cu `AGENTS.md`.
Nu înlocuiește regulile de siguranță, arhitectură, date și deploy din `AGENTS.md`.

## Cum se actualizează

- Adaugă sau modifică o regulă permanentă numai când utilizatorul cere să fie reținută aici.
- Nu transforma automat o cerință punctuală sau o presupunere într-o regulă generală.
- Păstrează formularea și domeniul cerut; nu extinde regula la alte acțiuni fără acord.
- Dacă o regulă nouă contrazice una existentă, cere clarificare înainte de înlocuire.
- La actualizare, spune pe scurt utilizatorului ce regulă a fost reținută.

## Reguli UI reținute

### Modale info cu buton `i`

Regulă aprobată de utilizator la 14.09.2026, inclusiv completarea privind textele explicative.

1. **Explicații exclusiv în modal:** orice comentariu, explicație sau indicație
   destinată utilizatorului se pune într-un modal info, conform regulilor de mai jos,
   nu direct în interfață. Nu afișa aceste texte ca note, paragrafe explicative sau
   indicații lângă controale; informația rămâne disponibilă prin butonul `i` asociat.
2. **Poziție:** butonul `i` este un superscript imediat după eticheta asociată,
   înaintea pill-urilor, contoarelor și chevroanelor. Nu acoperă textul sau alte
   controale. De exemplu, la „Raportare Managerială”, urmează după „Raportare”,
   înaintea pill-ului „Managerială”.
3. **Dimensiune:** păstrează formatul redus: buton de 18×18 px, cerc de 11,25 px,
   cu litera `i` centrată. Pe dispozitive tactile, zona de atingere este de minimum
   32×32 px, fără mărirea cercului sau suprapunerea acțiunii principale.
4. **Vizibilitate:** pe desktop, `i` apare la hover pe eticheta/butonul asociat sau
   la focus din tastatură. Rămâne vizibil când cursorul trece pe `i`. Pe dispozitive
   fără hover este vizibil permanent. Apariția și dispariția nu deplasează elementele.
5. **Prezentarea modalului:** modal centrat, cu lățime de maximum 480 px, adaptat
   telefonului și cu conținut derulabil.
6. **Conținut:** titlu specific; scop; datele și perioada utilizate; rezultatul;
   modificările, suprascrierile și condițiile relevante. Folosește explicații
   concrete, fără secțiuni inutile.
7. **Verificare UI:** verifică light/dark, desktop/mobil, RO/EN/HE, texte lungi,
   accesul prin tastatură și contrastul lizibil. Verifică și că poziționarea rămâne
   corectă când pill-urile sau contoarele sunt ascunse pe ecrane mici.

### Stil unitar pentru controalele de formular

Regulă aprobată de utilizator la 19.09.2026.

1. Orice câmp sau control nou trebuie să folosească sistemul vizual existent al
   aplicației; nu lăsa aspectul implicit al browserului dacă acesta diferă de
   celelalte controale.
2. Reutilizează stilurile comune pentru `input`, `select`, `textarea`, checkbox,
   butoane și stările lor, fără reguli locale care creează un aspect separat.
3. Pentru `input type="file"`, stilizează atât containerul, cât și butonul nativ
   prin `::file-selector-button`, astfel încât bordura, fundalul, raza, fontul și
   spațierea să fie coerente cu aplicația.
4. Verifică stările normal, hover, focus, disabled și aspectul în light/dark și
   pe mobil înainte de finalizarea modificării.

## Reguli pentru acțiuni reținute

### Selecția textului în modale editabile

Regulă aprobată de utilizator la 19.09.2026.

- Tragerea selecției de text dintr-un câmp până la marginea stângă, dreaptă,
  superioară sau inferioară nu închide modalul și nu activează interfața din fundal.
- Un modal care conține câmpuri editabile nu se închide prin clic sau pointer pe
  fundal. Se închide numai prin controalele explicite ale modalului ori prin Escape,
  dacă fluxul respectiv permite Escape.
- Dacă un modal exclusiv informativ permite închiderea prin fundal, evenimentele
  `pointerdown` și `pointerup` trebuie să înceapă și să se termine direct pe fundal,
  fără deplasare semnificativă și fără o selecție de text activă.
- La verificare, testează selectarea prin tragere până la ambele margini laterale,
  inclusiv pentru valori lungi, pe desktop și pe dispozitive tactile.

### Comportamentul butonului `i` și al modalului info

- Clicul pe `i` deschide exclusiv informația: nu execută acțiunea principală,
  nu schimbă tabul și nu modifică date.
- Ajutorul rămâne disponibil și pentru acțiuni dezactivate.
- Modalul se închide prin `×`, „Am înțeles” sau Escape.
- La închidere, focusul revine la butonul `i` care l-a deschis, fără închiderea
  modalului părinte.
- Funcția existentă a butonului `i` pentru tranzacțiile componente ale soldului
  rămâne distinctă; nu o înlocui cu ajutorul explicativ.
