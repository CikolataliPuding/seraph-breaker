# Seraph Breaker

İzometrik, anime tarzı bir mecha aksiyon oyunu. Tarayıcıda çalışır, kurulum gerektirmez.
Mavi, kırmızı ve yeşil mechalarla şehri mechalara ve meleklere karşı savunuyorsun.

**Hemen oyna:** https://selameddin00.github.io/seraph-breaker/

Bu proje bir topluluk projesi. Oyunun fikri arkadaş grubumuzdan çıktı; herkes istediği
özelliği ekleyebilir, istediği şeyi değiştirebilir. Nasıl katkı vereceğin
[CONTRIBUTING.md](CONTRIBUTING.md) dosyasında.

## Oyunda neler var

- **3 stage, 12 level, 3 boss:** Iron Colossus, Prism Angel ve The Last Seraph. Her bossun kendi sinematik girişi var.
- **Archero tarzı odalar:** Her level birkaç odadan oluşur (savaş, melek, elit, boss). Odalar açık bir minder; minderin dışına çıkarsan hasar alırsın.
- **3 birim:** Azure (hızlı tüfek), Crimson (saçma topu), Verdant (delici mızrak). Her birinin kendi özel hareketi var.
- **Level içi yetenekler:** Düşman öldürdükçe level atlar, 3 yetenekten birini seçersin. Melekler can ya da yetenek verir; şeytan, zırhın karşılığında yetenek teklif eder.
- **Kalıcı ilerleme:** Altınla yetenek ağacı, elmasla 6 silah ve 7 alet. Kayıt tarayıcıda tutulur.
- **Müzik:** Tarayıcıda canlı üretilen metal müzik. Ses dosyası yok, telif sorunu yok.
- **Telefon desteği:** İki parmakla oynanan sanal joystickler ve dokunmatik butonlar.

## Kontroller

| Bilgisayar | Telefon | İşlev |
|---|---|---|
| WASD | Sol başparmak | Hareket |
| Fare | Sağ başparmak (sürükle) | Nişan + ateş |
| Space | DASH | Atılma |
| Shift / sağ tık | HEX | Altıgen kalkan |
| Q | SP | Özel hareket |
| E / R | G1 / G2 | Aletler |
| P / Esc | II | Duraklat |

## Bilgisayarında çalıştırma

Kurulum ya da build adımı yok. Giriş dosyası [`index.html`](index.html); oyun kodu `js/`, görünüm `css/` klasöründe.
Three.js bir CDN'den yüklenir, bu yüzden ilk açılışta internet gerekir.

En kolayı `index.html` dosyasını çift tıklayıp tarayıcıda açmak. Bazı tarayıcılar yerel dosyalarda kısıtlama
yapabilir; o zaman klasörde küçük bir sunucu başlat:

```bash
python -m http.server 8000
```

Sonra tarayıcıda `http://localhost:8000` adresini aç.

## Lisans

[MIT](LICENSE). Kodu istediğin gibi kullanabilir, değiştirebilir ve paylaşabilirsin.
