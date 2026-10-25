// Seraph Breaker · lang-tr.js: Turkish text. Keys are the English source text (i18n.js t()); a missing key shows English.
/* Translator notes: {0} {1} are numbers or names filled in by the game. A name that stays English maps to itself, which keeps it off
   the missing list (LANG_MISS). Terms: Frame = Gövde, Run = Koşu, Core = Çekirdek, Gadget = Aparat (patch.md 22.7). */
const DICT_TR={
  // HUD
  'LEVEL READY':'SEVİYE HAZIR', 'Armor':'Zırh', 'Power':'Güç', 'Special':'Özel', 'Hubris':'Hubris', 'ROOM':'ODA', 'WAVE':'DALGA',
  // hangar
  'AUTOCRAT':'AUTOCRAT', 'PILOT':'PİLOT', 'BETA TESTER':'BETA TESTÇİ', '[CALLSIGN]':'[ÇAĞRI ADI]',
  'Gold: from every kill, spent on the Core and cosmetics':'Altın: her öldürmeden gelir; Çekirdek ve kozmetiğe harcanır',
  'Diamonds: from bosses and first clears, spent on the skill tree, the armory and new frames':'Elmas: bosslardan ve ilk temizlemelerden gelir; yetenek ağacına, cephaneliğe ve yeni gövdelere harcanır',
  'Arena map':'Arena haritası', 'Frame':'Gövde', 'Continue run':'Koşuya devam et', 'Sortie ▸':'Göreve çık ▸', 'Back to hangar':'Hangara dön',
  'Arena Select':'Arena seçimi', 'Launch ▸':'Başlat ▸', 'Arenas':'Arenalar',
  'Armory':'Cephanelik', 'Weapons':'Silahlar', 'Gadgets':'Aparatlar', 'Cosmetics':'Kozmetik',
  'Weapons replace your frame\'s signature gun. Gadgets add moves of their own: equip two.':'Silahlar gövdenin kendi silahının yerine geçer. Aparatlar kendi hareketlerini ekler: iki tane tak.',
  'Gold buys looks only, never power. Paint, shot colors and arena themes are on the way.':'Altın sadece görünüş alır, asla güç almaz. Boya, atış renkleri ve arena temaları yolda.',
  'Upgrades':'Geliştirmeler', 'Core':'Çekirdek', 'Skill tree':'Yetenek ağacı',
  'Permanent upgrades for every frame. Core levels cost gold and never cap out early; tree nodes cost diamonds and open one after another.':'Her gövde için kalıcı geliştirmeler. Çekirdek seviyeleri altınla alınır ve erken tavan yapmaz; ağaç düğümleri elmasla alınır ve sırayla açılır.',
  'Frames':'Gövdeler', 'Pilot callsign':'Pilot çağrı adı', 'Enter callsign':'Çağrı adını yaz',
  'Frame · sets your special move · new frames cost diamonds':'Gövde · özel hareketini belirler · yeni gövdeler elmasla alınır',
  'Primary paint':'Ana boya', 'Accent paint':'Vurgu boyası', 'Loadout':'Teçhizat',
  'Hangar':'Hangar', 'Skills':'Yetenekler', 'Battle':'Savaş',
  // system
  'System':'Sistem', 'Language':'Dil', 'Changing the language reloads the page.':'Dil değişince sayfa yenilenir.', 'Music':'Müzik', 'Effects':'Efektler',
  'The soundtrack is synthesized live in your browser, so it is original and free of copyright claims.':'Müzik tarayıcında canlı olarak sentezlenir; bu yüzden özgündür ve telif sorunu yoktur.',
  'Progress is saved in this browser only.':'İlerleme sadece bu tarayıcıda kaydedilir.',
  'WASD':'WASD', 'Mouse':'Fare', 'Click':'Tık', 'Space':'Boşluk', 'Shift':'Shift', 'RMB':'Sağ tık', 'move ·':'hareket ·', 'aim ·':'nişan ·', 'fire ·':'ateş ·',
  'dash ·':'atılma ·', 'barrier ·':'bariyer ·', 'special ·':'özel ·', 'gadgets ·':'aparatlar ·', 'pause':'duraklat',
  'Drag anywhere in the lower screen to move. Let go to stop and auto-fire at the nearest enemy in sight. Dash (2 charges) goes where you choose, never at the auto-aim target: tap the DASH button while moving to dash along the stick, or drag from it to aim; with the stick held, a tap of your other thumb also dashes; or double-tap and slide; or flick the stick. The barrier (Auto) blocks a shot on its own while power is above 60: the hex ring around you and the two pips show its charges. Manual swaps it for a hold-to-shield button. Big button: special. Small buttons: gadgets.':
    'Hareket etmek için ekranın alt yarısında herhangi bir yeri sürükle. Bıraktığında durur ve görüş alanındaki en yakın düşmana otomatik ateş edersin. Atılma (2 şarj) senin seçtiğin yöne gider, asla otomatik nişan hedefine gitmez: hareket ederken DASH düğmesine dokun ve çubuk yönünde atıl, ya da düğmeden sürükleyerek nişan al; çubuğu tutarken diğer başparmağınla dokunmak da atılır; ya da çift dokunup kaydır; ya da çubuğu fırlat. Bariyer (Otomatik), güç 60\'ın üstündeyken bir atışı kendiliğinden engeller: etrafındaki altıgen halka ve iki nokta şarjlarını gösterir. Manuel, onu basılı tutulan bir kalkan düğmesine çevirir. Büyük düğme: özel. Küçük düğmeler: aparatlar.',
  'Controls':'Kontroller', 'Auto':'Otomatik', 'Phone':'Telefon', 'Desktop':'Masaüstü', 'Mobile shield':'Mobil kalkan', 'Manual':'Manuel',
  'Auto-use gadgets (phone mode)':'Aparatları otomatik kullan (telefon modu)',
  'Tester code':'Tester kodu', 'Unlock':'Aç', 'For testers only. Tester runs are flagged and never count for rankings.':'Sadece testçiler için. Tester koşuları işaretlenir ve sıralamaya asla girmez.',
  'Tester tools in game (reloads the page)':'Oyun içi tester araçları (sayfayı yeniler)',
  'Main Stage access code':'Ana Sahne erişim kodu', 'Access code':'Erişim kodu', 'The Main Stage is in beta. Enter the access code to open it.':'Ana Sahne beta aşamasında. Açmak için erişim kodunu gir.',
  'Fullscreen':'Tam ekran', 'Reset my progress':'İlerlememi sıfırla', 'Replay story':'Hikayeyi yeniden oynat',
  // story, cards, pause, report
  'Skip ▸▸':'Geç ▸▸', 'Next ▸':'İleri ▸', 'Skip ▸':'Geç ▸', 'WARNING':'UYARI',
  'Level up':'Seviye atladın', 'Choose a skill':'Bir yetenek seç', 'Reroll':'Yeniden çek',
  'Paused':'Duraklatıldı', 'Resume':'Devam et', 'Save & exit':'Kaydet ve çık', 'Abandon run':'Koşuyu bırak',
  'Save & exit continues from the last cleared room. Gold and diamonds you already picked up are always kept.':'Kaydet ve çık, son temizlenen odadan devam eder. Topladığın altın ve elmaslar her zaman sende kalır.',
  'Mission report':'Görev raporu', 'Level':'Seviye', 'Retry boss':'Boss\'u tekrar dene', 'Next arena':'Sonraki arena',
  // phone hint
  'Drag to move · let go to fire · dash: DASH button (drag to aim) or double-tap and slide':'Hareket için sürükle · ateş için bırak · atılma: DASH düğmesi (nişan için sürükle) ya da çift dokunup kaydır',
};
