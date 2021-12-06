const videojsVersions = () => {
    return fetch('https://api.cdnjs.com/libraries/video.js?fields=versions,latest')
        .then(response => response.json())
        .then(({ versions }) => versions.filter((version) => version.startsWith('7')))
        .then(versions => versions.reverse());
}

const versionOptions = (versions = [], defaultVersion) => {
    const fragment = document.createDocumentFragment();

    versions.forEach(version => {
        const option = document.createElement('option');
        option.textContent = version;
        option.value = version;


        if (`@${version}` === defaultVersion) {
            option.selected = true
        }

        fragment.appendChild(option);

    });

    if (versions.length) {
        $('.versions').appendChild(fragment);
    }
}

const videojsCssLoader = (version) => {
    const link = document.createElement('link');
    const css = `https://unpkg.com/video.js${version}/dist/video-js.css`;

    link.rel = 'stylesheet';
    link.href = css;

    document.head.appendChild(link);
}

const videojsScriptLoader = (version, callback) => {
    const videojsScript = document.createElement('script');
    const src = `https://unpkg.com/video.js${version}/dist/video.js`;

    videojsScript.async = true;
    videojsScript.defer = 'defer';
    videojsScript.src = src;
    videojsScript.type = 'text/javascript';
    videojsScript.onload = callback;

    document.body.appendChild(videojsScript);
}

const emeScriptLoader = (callback) => {
    const emeScript = document.createElement('script');

    emeScript.async = true;
    emeScript.defer = 'defer';
    emeScript.src = 'https://cdn.jsdelivr.net/npm/videojs-contrib-eme@3.9.0/dist/videojs-contrib-eme.js';
    emeScript.type = 'text/javascript';
    emeScript.onload = callback;

    document.body.appendChild(emeScript);
}

const unitedState = (key, value, reload = false) => {
    const url = new URL(window.location.href);

    if (key && value && value.trim()) {
        url.searchParams.set(key, value);
    }

    window.history.pushState(null, null, url);

    if (reload) {
        window.location = url;
    }
}

const unitedStateCleaner = (...keys) => {
    if (keys) {
        const location = new URL(window.location.href);

        keys.forEach((key) => {
            location.searchParams.delete(key);
        });

        history.replaceState(null, null, location);
    }
}

const mimeTypeFinder = (mimeType) => {
    const [type] = mimeType.match(/mpd|m3u8/) || [];

    if (type) {
        return type.endsWith('mpd') ? 'DASH' : 'HLS';
    }

    return '📼';
}

const mimeTypeSelector = (mimeType) => {
    Array
        .from($$('.resource__mime-type option'))
        .find(option => option.label === mimeTypeFinder(mimeType))
        .selected = true;
}

const drmFinder = () => {
    if (!$('#enable-drm').checked) {
        return;
    }

    if ($('#drm-select').selectedIndex === 1) {
        return {
            'com.apple.fps.1_0': {
                certificateUri: $('#certificate').value,
                licenseUri: $('#license').value
            }
        };
    }

    return {
        'com.widevine.alpha': $('#license').value
    };
}

const drmCleanator = () => {
    $('#license').value = '';
    $('#certificate').value = '';

    unitedStateCleaner('drm-vendor', 'drm-license', 'drm-certificate');
}

const drmSaveator = () => {
    if (!$('#enable-drm').checked) {
        drmCleanator();

        return;
    };

    const vendor = Array.from($$('#drm-select option')).find(option => option.selected).label;
    const license = $('#license').value;
    const certificate = $('#certificate').value;


    unitedState('drm-vendor', vendor);
    unitedState('drm-license', license);
    unitedState('drm-certificate', certificate);
};

const drmRestorator = (vendor, license, certificate) => {
    if (!vendor && !licence) return;

    if (vendor) {
        $('details').open = true;
        $('#enable-drm').checked = true;

        setTimeout(() => {
            $('#enable-drm').dispatchEvent(new Event('change'));
        }, 0);

        Array
            .from($$('#drm-select option'))
            .find(option => option.label === vendor)
            .selected = true;
    }

    if (license) {
        $('#license').value = license;
    }

    if (certificate) {
        $('#certificate').value = certificate;
    }
}

let player = undefined;

(async () => {
    const versions = await videojsVersions();
    const url = new URL(location.toString());
    const defaultVersion = url.searchParams.has('version') ? `@${url.searchParams.get('version')}` : `@${versions[0]}`;
    const mediaSource = url.searchParams.has('url') ? url.searchParams.get('url') : undefined;
    const drmVendor = url.searchParams.has('drm-vendor') ? url.searchParams.get('drm-vendor') : undefined;
    const drmLicense = url.searchParams.has('drm-license') ? url.searchParams.get('drm-license') : undefined;
    const drmCertificate = url.searchParams.has('drm-certificate') ? url.searchParams.get('drm-certificate') : undefined;
    const superPowerActivation = $('audio');

    if (mediaSource) {
        $('.resource__url').value = mediaSource;
        mimeTypeSelector(mediaSource);
    }

    versionOptions(versions, defaultVersion);
    videojsCssLoader(defaultVersion);
    videojsScriptLoader(defaultVersion, () => {
        emeScriptLoader(() => {
            if (drmVendor) {
                drmRestorator(drmVendor, drmLicense, drmCertificate);
            }

            const options = {
                liveui: true,
                liveTracker: {
                    trackingThreshold: 120,
                    liveTolerance: 30,
                },
                responsive: true,
            };
            const source = {
                src: mediaSource ? mediaSource : 'https://wowzaec2demo.streamlock.net/live/bigbuckbunny/manifest_mpm4sav_mvtime.mpd',
                type: mediaSource ? $('.resource__mime-type').value : 'application/dash+xml',
                keySystems: drmFinder(),
            };

            player = new videojs('player', options);


            player.eme();
            player.poster('http://lorempixel.com/640/360/abstract/');
            player.src(source);

            $('.vhs').innerText = JSON.stringify(videojs?.VhsHandler?.version() || videojs.HlsSourceHandler.VERSION, null, 2);
            $('.versions').addEventListener('change', () => unitedState('version', $('.versions').value, true));
            $('.resource__url').addEventListener('input', () => mimeTypeSelector($('.resource__url').value));
            $('.resource__submit').addEventListener('click', () => {
                const url = $('.resource__url').value;

                if (url) {
                    mimeTypeSelector(url);
                    unitedState('url', url);
                    drmSaveator();

                    player.src({ src: url, type: $('.resource__mime-type').value, keySystems: drmFinder() });
                    console.log('currentSource', player.currentSource());
                }
            });
            $('.cassetator-hero').addEventListener('click', () => superPowerActivation.play());
            $('#enable-drm').addEventListener('change', () => {
                if ($('#enable-drm').checked) {
                    $('.drm__vendors').classList.add('drm__vendors--show');
                    return;
                }

                $('.drm__vendors').classList.remove('drm__vendors--show');
            });
            $('#drm-select').addEventListener('change', () => {
                if ($('#drm-select').selectedIndex === 1) {
                    $('.drm__certificate-label').classList.remove('hide');
                    return;
                }

                $('.drm__certificate-label').classList.add('hide');
            });
        });
    });
})();