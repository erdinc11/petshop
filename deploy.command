#!/bin/bash

# Dosyanın bulunduğu klasöre geç
cd "$(dirname "$0")"

# M3 Mac (Apple Silicon) için Homebrew yolunu tanımla
export PATH="/opt/homebrew/bin:$PATH"

echo "=================================================="
echo "Surge Host Yöneticisi"
echo "=================================================="
echo "Lütfen yapmak istediğiniz işlemi seçin:"
echo "1) Siteyi Yükle veya Güncelle"
echo "2) Siteyi Yayından Kaldır (Sil)"
echo "=================================================="
read -p "Seçiminiz (1 veya 2): " secim

if [ "$secim" == "1" ]; then
    echo ""
    echo "Dağıtım başlatılıyor..."

    # Node.js (npm) kurulu değilse Homebrew ile kur
    if ! command -v npm &> /dev/null; then
        echo "Node.js bulunamadı. Kuruluyor..."
        brew install node
    fi

    # CNAME dosyası yoksa rastgele URL oluştur ve kaydet
    if [ ! -f "CNAME" ]; then
        RANDOM_DOMAIN="$(LC_ALL=C tr -dc 'a-z0-9' < /dev/urandom | head -c 8).surge.sh"
        echo "$RANDOM_DOMAIN" > CNAME
        echo "İlk yükleme: Yeni URL oluşturuldu ($RANDOM_DOMAIN)"
    else
        RANDOM_DOMAIN=$(cat CNAME)
        echo "Güncelleme yapılıyor. Mevcut URL: $RANDOM_DOMAIN"
    fi

    # Klasörü Surge sunucularına yükle/güncelle
    npx --yes surge ./ "$RANDOM_DOMAIN"

    echo "=================================================="
    echo "İşlem tamamlandı! Siteniz yayında: https://$RANDOM_DOMAIN"
    echo "=================================================="

    # Siteyi varsayılan tarayıcıda otomatik aç
    open "https://$RANDOM_DOMAIN"

elif [ "$secim" == "2" ]; then
    echo ""
    echo "Siteyi internetten kaldırma işlemi başlatılıyor..."
    
    # CNAME dosyası var mı kontrol et
    if [ ! -f "CNAME" ]; then
        echo "=================================================="
        echo "Hata: CNAME dosyası bulunamadı."
        echo "Bu klasör için kayıtlı bir site adresi yok veya zaten silinmiş."
        echo "=================================================="
    else
        DOMAIN=$(cat CNAME)
        echo "Silinecek site: https://$DOMAIN"
        
        # Surge üzerinden siteyi sil
        npx --yes surge teardown "$DOMAIN"
        
        # İşlem başarılı (hata kodu 0) ise CNAME dosyasını da temizle
        if [ $? -eq 0 ]; then
            rm CNAME
            echo "=================================================="
            echo "İşlem başarılı! https://$DOMAIN internetten tamamen kaldırıldı."
            echo "Klasörünüzdeki adres kaydı (CNAME) sıfırlandı."
            echo "=================================================="
        else
            echo "=================================================="
            echo "Silme işlemi sırasında bir hata oluştu."
            echo "=================================================="
        fi
    fi
else
    echo ""
    echo "Hatalı seçim yaptınız. İşlem iptal edildi."
fi

