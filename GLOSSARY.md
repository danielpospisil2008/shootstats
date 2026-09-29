# Slovníček pojmů

Vysvětlení pojmů z programování a vývoje, které se objevují u Shootstats —
psané pro laika. Seřazeno zhruba od nejdůležitějšího (pro pochopení téhle
aplikace) po okrajové. Roste průběžně, jak se nové pojmy objeví.

---

## 1. Jádro aplikace

### HTML / CSS / JavaScript
Tři jazyky, ze kterých se skládá každá webová stránka.
- **HTML** = obsah a struktura (nadpisy, tlačítka, seznamy).
- **CSS** = vzhled (barvy, rozměry, rozložení). To „červené pozadí" byla změna v CSS.
- **JavaScript (JS)** = chování a logika (co se stane po kliknutí, počítání statistik, komunikace s databází).
Celý Shootstats je **jeden soubor `index.html`**, který obsahuje všechny tři.

### Klient vs. server (client-side / server-side)
- **Klient** = kód běžící v prohlížeči uživatele. Uživatel do něj vidí a může si ho upravit.
- **Server** = kód/pravidla běžící „u poskytovatele", kam uživatel nevidí a nemůže je obejít.
Důležitý důsledek: **kontrola v klientovi je jen pohodlí, ne ochrana.** Když appka skryje tlačítko „smazat", šikovný uživatel si ho přes konzoli prohlížeče stejně zavolá. Skutečnou hranici drží až server — u nás **Security Rules**.

### Firebase
Sada hotových „serverových" služeb od Googlu, aby si člověk nemusel psát vlastní backend. Shootstats z ní používá dvě části: **Authentication** (přihlašování) a **Realtime Database** (ukládání dat). Načítá se za běhu z Googlího serveru.

### Realtime Database (RTDB)
Databáze od Firebase. Není to tabulka jako v Excelu — je to **jeden velký strom** (jako složky a podsložky), uložený ve formátu podobném JSONu. Cesta `users/abc123/sessions` je „složka" se sessions uživatele `abc123`. Shootstats sem ukládá tréninky, závody, profily a skupiny.

### Firebase Authentication
Část Firebase, která řeší **přihlašování** — e-mailem/heslem nebo přes Google. Každý přihlášený uživatel dostane **UID** (viz níže). Rozhoduje o tom, „kdo jsi", ale **ne** „co smíš" — to řeší Security Rules.

### Security Rules (bezpečnostní pravidla)
Soubor pravidel (u nás `database.rules.v2.json`), který na **serveru** rozhoduje, kdo smí číst a zapisovat do které části databáze. Píše se ve vlastním mini-jazyce (`auth.uid === $uid` = „jsi ten uživatel, jehož data chceš"). **Tohle je jediná skutečná ochrana dat** — proto se kolem nich točila celá bezpečnostní revize. Živě platí ta verze, která je nahraná ve Firebase konzoli.

### UID (User ID)
Náhodný jednoznačný identifikátor uživatele, který přiřadí Firebase Authentication při registraci (např. `a8ee77d0-09c8-40ec-...`). V databázi se jím jmenují „složky" jednotlivých lidí. Není to e-mail ani jméno — je neprůhledný a nemění se.

---

## 2. Nasazení a verzování

### Git
Systém pro **verzování** — ukládá historii všech změn v projektu, umí se vrátit zpět, porovnávat verze a spojovat práci z více směrů. Nepracuje automaticky; změny se do historie zapisují **commitem**.

### Repozitář (repo)
Složka projektu i s celou jeho Git historií. Náš repozitář je `Shootstats`.

### Commit
Jeden **zaznamenaný snímek změn** v Gitu, s popiskem (např. *„Harden Firebase rules + fix XSS"*). Dokud změny nezacommituješ, jsou jen „rozdělané" v pracovní složce a v historii/grafu je nevidíš. Commit se **nepojmenovává podle větve** — má vlastní popisnou zprávu.

### Větev (branch)
Samostatná linie vývoje. Umožňuje pracovat na něčem (např. větev `security`) bez zásahu do hlavní verze (`main`). **Vytvoření větve nevytváří commit** — jen ukazatel, který se posouvá s každým dalším commitem. Když jsi vytvořil větev `security`, graf pořád ukazoval starý commit, protože nové změny nebyly zacommitované.

### main
Hlavní větev projektu. U Shootstats platí: **co je na `main`, to Netlify nasadí do ostrého provozu.**

### Push / Pull
- **Push** = odeslání tvých místních commitů na GitHub (na server).
- **Pull** = stažení cizích commitů z GitHubu k sobě.
Dokud nepushneš, změny jsou jen na tvém počítači.

### Pull Request (PR)
Návrh na sloučení jedné větve do druhé (typicky `security` → `main`), kde se dá změna prohlédnout a okomentovat před tím, než se přijme.

### Working tree / staging (pracovní strom / příprava)
- **Working tree** = soubory tak, jak je právě máš rozeditované na disku.
- **Staging** (`git add`) = výběr toho, co půjde do příštího commitu.
- `git commit` = z nastagovaného udělá snímek v historii.

### Netlify
Služba, která **hostuje** web Shootstats a automaticky ho **nasazuje**: jakmile na GitHub přijde nový commit na `main`, Netlify web zveřejní. Konfigurace je v `netlify.toml`.

### Deploy / deploy preview
- **Deploy** = zveřejnění nové verze webu.
- **Deploy preview** = dočasná zvláštní adresa pro větev/PR, kde si změnu vyzkoušíš (třeba na mobilu) dřív, než jde na ostro.

### Free tier / kvóta (bandwidth, storage…)
„Zdarma" u Netlify i Firebase neznamená „bez limitu" — jde o měsíční **kvótu** (třeba kolik dat se smí za měsíc stáhnout z appky = **bandwidth**, nebo kolik dat smí ležet v databázi = **storage**). Obě služby to sledují nezávisle na sobě a mají **oddělené** kvóty — Netlify hlídá kvótu na doručení `index.html`, Firebase kvótu na databázi. Co se stane po vyčerpání, je u každé jinak — viz [[free-tier-shootstats]] v paměti, nebo se zeptej znovu, ať to ověřím aktuálně (pravidla se v čase mění).

### Spark / Blaze (Firebase plány)
- **Spark** = bezplatný plán Firebase s pevnou kvótou (aktuálně řádově 1 GB uložených dat, 10 GB stažených za měsíc u Realtime Database). Po vyčerpání appka přestane číst/zapisovat, dokud se kvóta příští měsíc neobnoví.
- **Blaze** = plán „plať, jen když přerosteš" — do stejné bezplatné kvóty jako Spark je pořád zdarma, nad ní se účtuje. Vyžaduje přidat platební kartu. Výhoda: appka „nezhasne", jen případně začne něco stát.

---

## 3. Bezpečnost

### XSS (Cross-Site Scripting)
Zranitelnost, kdy útočník uloží do dat **kód** (kousek JavaScriptu/HTML) a appka ho pak nevědomky spustí v prohlížeči jiného uživatele — pod jeho přihlášením. U Shootstats šlo o pole „profilová fotka": dalo se tam místo obrázku vložit škodlivý řetězec, který by se spustil v prohlížeči trenéra. Oprava = přísně kontrolovat, že fotka je opravdu obrázek, než se vloží do stránky (a totéž pravidlo i na serveru).

### Escapování (escaping)
Zneškodnění „nebezpečných" znaků v uživatelském textu tak, aby se zobrazil jako text a ne se vykonal jako kód. Funkce `escapeHtml` v `index.html` z `<` udělá neškodné `&lt;`.

### Data URL / base64
Způsob, jak nacpat celý soubor (obrázek) přímo do textu jako dlouhý řetězec, místo odkazu na jiný server. Začíná `data:image/jpeg;base64,` a pak následuje obrázek zakódovaný v **base64** (jen písmena, číslice a pár znaků). Shootstats takhle ukládá profilové fotky.

### API / API klíč
- **API** = rozhraní, přes které spolu programy mluví (naše appka ↔ Firebase).
- **API klíč** = identifikátor projektu v požadavcích. Firebase „apiKey" v `index.html` **není heslo** — je veřejný záměrně a posílá se do každého prohlížeče. Data chrání Security Rules, ne utajení klíče.

### HTTPS
Šifrované spojení mezi prohlížečem a serverem (zámeček v adresním řádku). Zajišťuje Netlify automaticky.

### Bezpečnostní hlavičky (security headers)
Instrukce, které server posílá prohlížeči navíc k obsahu, aby omezil rizika (např. `X-Frame-Options` = „nedovol cizí stránce vložit nás do rámečku"). U nás jsou v `netlify.toml`.

### App Check / reCAPTCHA
Mechanismus, který ověřuje, že požadavky na databázi chodí ze skutečné appky, ne z robota/skriptu. V Shootstats je připravený, ale **vypnutý** (dělal problémy na mobilu).

---

## 4. Nástroje a pojmy okolo

### JSON
Textový formát pro strukturovaná data — dvojice „klíč: hodnota", vnořené složky, seznamy. Používá ho RTDB, soubor pravidel i `package.json`. Je citlivý na přesnou syntaxi (uvozovky, čárky) — proto „Failed to parse payload" znamenalo, že text nebyl platný JSON (nejspíš „kudrnaté" uvozovky z kopírování).

### Konzole prohlížeče (DevTools)
Vývojářský panel v prohlížeči (F12). Ukazuje chyby, jde v ní spouštět JavaScript a prohlížet síťové požadavky. Zároveň důvod, proč „schované" tlačítko není ochrana — kdokoli si tu může kód zavolat ručně.

### DOM
Strom prvků stránky tak, jak ho prohlížeč drží v paměti poté, co načte HTML. JavaScript ho mění za běhu (přidá řádek do seznamu tréninků atd.).

### localStorage
Malé úložiště přímo v prohlížeči uživatele. Shootstats sem ukládá data, když uživatel **není přihlášený** (režim „bez účtu"). Je to jen na jednom zařízení a jde to smazat.

### CDN (Content Delivery Network)
Síť serverů po světě, která rychle rozdává soubory (knihovny, fonty). Shootstats z CDN Googlu načítá Firebase SDK.

### SDK (Software Development Kit)
Hotová knihovna kódu od poskytovatele, kterou zavoláš místo psaní vlastního. „Firebase SDK" = funkce jako `fbDb.ref(...).set(...)`.

### npm / package.json / závislost (dependency)
- **npm** = správce balíčků pro Node.js (stahuje knihovny).
- **package.json** = seznam balíčků a příkazů projektu.
- **závislost** = cizí knihovna, na které projekt stojí.
U Shootstats se npm používá **jen** na spuštění testů pravidel (`npm test`); samotná appka žádné závislosti nemá.

### node_modules / .gitignore
- **node_modules** = složka, kam npm stáhne knihovny (velká, generovaná).
- **.gitignore** = seznam souborů/složek, které Git **záměrně ignoruje** (nemá smysl je verzovat). `node_modules` je tam.

### Build step (build krok)
Proces, který ze zdrojového kódu vyrobí finální verzi webu (sloučí soubory, zmenší je…). Shootstats **žádný build nemá** — `index.html` se nasazuje tak, jak je. To je záměr (jednoduchost).

### Regulární výraz (regex)
Zápis vzoru pro hledání/ověřování v textu. `^data:image\/...` = „řetězec musí začínat `data:image/`...". Použili jsme ho ke kontrole, že profilová fotka je opravdu obrázek.

### Rules Playground / emulator
- **Playground** = nástroj ve Firebase konzoli na zkoušení pravidel „co by se stalo, kdyby uživatel X zapsal Y".
- **Emulator** = lokální kopie Firebase služeb pro testování bez zásahu do ostrých dat.
- **targaryen** = knihovna, kterou používá náš `npm test` — vyhodnocuje pravidla lokálně, offline.

### Prostředí: local / production (lokální / ostré)
- **Local** = běží u tebe na počítači (`dev.cmd`, `http://localhost`).
- **Production (ostrý provoz)** = veřejná verze na Netlify.
Pozn.: obě u Shootstats mluví se **stejnou** Firebase databází, takže i testovací zápisy jsou reálná data.
