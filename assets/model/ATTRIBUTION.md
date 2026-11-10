# Model kaynağı ve lisansı

BodyParts3D, © The Database Center for Life Science, CC Attribution-Share Alike 2.1 Japan.

- [Özgün proje](https://lifesciencedb.jp/bp3d/)
- [Veri arşivi](https://doi.org/10.18908/lsdba.nbdc00837-000)
- Sürüm: BodyParts3D 3.0, 20110915, BodyParts3D_3.0_obj_95.
- [İndirilen STL dönüşümleri](https://github.com/Kevin-Mattheus-Moerman/BodyParts3D/tree/main/assets/BodyParts3D_data/stl)
- [CC BY-SA 2.1 JP](https://creativecommons.org/licenses/by-sa/2.1/jp/), yerel lisans metni: LICENSE.txt.
- Mitsuhashi N ve ark. BodyParts3D: 3D structure database for anatomical concepts. Nucleic Acids Research 2009;37:D782–D785. https://doi.org/10.1093/nar/gkn613

## Türetilmiş model

İşitme kemikçikleri dışındaki 200 erişkin kemiği temsil eden 202 kemik ağı ve bağlam için 28 diş ağı kullanılır. Ağ sayısının farkı, sternumun manubrium, gövde ve xiphoid olarak üç kaynak parçasından oluşmasıdır. Dişler soru değildir. Soru havuzu 51 birimdir; çift kemikler birlikte vurgulanır.

Kafatasının v1 sadeleştirmesi korunur: yaklaşık %28 üçgen hedefi ve %0,3 hata sınırı. Yeni STL dosyaları tek tek indirilir, köşeleri birleştirilir ve meshoptimizer 0.25.0 ile el/ayak için en fazla 700, diğer kemikler için 1400 üçgen hedefi ve %1,2 hata toleransıyla sadeleştirilir. Float32 konum ve Uint16 indisler 12 bölge dosyasına paketlenir. Manifest özgün kimlikleri ve adları korur. Toplam ikili veri 3.638.972 bayttır.

El ve ayak bölgelerinde iki tarafın kemikleri, kendi iç anatomik ilişkileri korunarak görünümde yan yana yaklaştırılır. Kaynak dünya konumları ikili dosyalarda korunur. Görüntüleme sırasında eksenler dönüştürülür. Sağ üst görünüm hedef kemiği komşularından ayırır; çift birimlerde tek tarafı başka açıdan büyütür.

## Sakrum ve koksiks ayrımı

Kaynak FMA16202 hem sakrumu hem koksiksi içerir; ayrı koksiks STL’si yoktur. Bu etiketleme sorunu [Clarkson ve Whipple, 2018, Şekil 5](https://pmc.ncbi.nlm.nih.gov/articles/PMC6371295/) tarafından da belgelenmiştir.

Ağın yan izdüşümünde görünen sakrokoksigeal birleşimde, kaynak z=828 mm düzleminde üçgen merkezlerine göre ayırma yapılır. Üst bölüm 16202, alt bölüm koksiksin FMA kimliği 20229 ile tutulur; manifestte bunun özgün bağımsız dosya olmadığı açıkça yazılıdır. Yeni anatomi geometrisi eklenmez. Sınır yaklaşık bir segmentasyondur ve hekim kontrolü gerektirir. Kesit yüzeyi kapatılmadığından yakın görünümde üst kenar açık olabilir.

İşitme kemikçikleri bu STL sürümünde bulunmadığı için sorulmaz. Tüm arşiv indirilmez. `npm install` ardından `python3 scripts/fetch-model.py` indirme, sadeleştirme ve paketlemeyi yürütür; her ham STL işlendikten hemen sonra silinir. `scripts/prepare-model.mjs`, geçici sadeleştirilmiş parçalardan paketleri yeniden birleştirir. /tmp altındaki ara veriler teslim sonunda temizlenmiştir.

Bu türetilmiş model aynı CC BY-SA 2.1 JP lisansı altındadır. Bu lisans, model dışındaki kaynak kodu için otomatik bir lisans beyanı değildir.

## Task 8 · güncel kapsam ve Z-Anatomy kemikçikleri

Yukarıdaki 51 birim ve kemikçiklerin sorulmadığı bilgisi v2 tarihçesidir. Güncel havuz **70 soru birimiyle standart 206 erişkin kemiğinin tamamını** kapsar. Sternumun üç parçası ayrı öğretilir, erişkin sayımında bir kemiktir. Dişler yalnız bağlamdır. BodyParts3D dosyaları ve malzemeleri korunmuştur.

- Ek kaynak: [Z-Anatomy / Lluís Vinent Juanico](https://github.com/LluisV/Z-Anatomy), model katkısı Gauthier Kervyn ve Z-Anatomy projesi. [Proje lisansı ve katkıcılar](https://github.com/LluisV/Z-Anatomy/blob/PC-Version/LICENSE) (yerel tam metin: `LICENSE-Z-ANATOMY.txt`), [model ve lisans açıklaması](https://github.com/LluisV/Z-Anatomy/blob/PC-Version/README.md).
- Dosya: `Resources/Models/FBX/SkeletalSystem100.fbx`, Git blob SHA-1 `7c62e45211bf3992bb7239170343e06e2b073865`. Yalnız `Malleusl/r`, `Incusl/r`, `Stapesl/r` adlı altı gerçek kemik ağı kullanılır. Etiket/işaret geometrileri alınmaz.
- Türetilmiş dosya: `ossicles.bin` (260.640 bayt), **[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)**. Diğer BodyParts3D dosyalarının 2.1 JP bildirimi korunur; bu yeni paketin lisansı 4.0'dır. Kaynak kodun lisansı hakkında beyan değildir.
- Değişiklikler: FBX dünya dönüşümleri uygulandı; yedi eş kafatası kemiğinin sınır kutularıyla tekdüze ölçek ve öteleme hesaplandı. Ölçek **9,687329837**, öteleme (FBX dünya eksenleriyle mm) **[−0,647520028; −13,808417041; 97,866864752]**. Sınır kutusu koordinatlarında RMS uyum hatası **0,4333 mm**. Bu değer anatomik doğrulama veya kulak içi yüzey eşleştirmesi değildir. Orta kulak yerleşimi hekim kontrolü listesinde tutulur.
- İlişkili altı kemiğin kendi konum/oranları korunur; yeni şekil uydurulmadı. Köşeler birleştirildi, Float32/Uint16 olarak eksen dönüşümüyle paketlendi. Ham FBX başarıyla işlenince silinir. Yeniden üretim: `node scripts/prepare-ossicles.mjs /tmp/z-skeleton.fbx`; dönüşüm tarifi `scripts/ossicles-alignment.json`.
- Kemikçik sorularında ana kamera temporal bölgeye, ikinci kamera tek kemikçiğe çok yakından bakar. Ekrandaki model notu bu sorularda Z-Anatomy lisansını gösterir. Ham indirme depoya dahil edilmez.
