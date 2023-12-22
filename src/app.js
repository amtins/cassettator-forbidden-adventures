import loadator from "./loadator.js";

//https://medium.com/geekculture/sorting-an-array-of-semantic-versions-in-typescript-55d65d411df2
const versionsComparator = (a, b) => {
    const a1 = a.split('.');
    const b1 = b.split('.');
    const len = Math.min(a1.length, b1.length);

    for (let i = 0; i < len; i++) {
        const a2 = +a1[i] || 0;
        const b2 = +b1[i] || 0;

        if (a2 !== b2) {
            return a2 < b2 ? 1 : -1;
        }
    }

    return a1.length - b1.length;
};

const videojsVersions = () => {
    return fetch('https://registry.npmjs.org/video.js')
        .then(response => response.json())
        .then(({ versions, ['dist-tags']: tags }) => ({ versions: Object.keys(versions), tags }))
        .then(({ versions }) => versions.filter((version) => version.startsWith('7') || version.startsWith('8')))
        .then(versions => versions.sort(versionsComparator));
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

window.player = undefined;

(async () => {
    const versions = await videojsVersions();
    const url = new URL(location.toString());
    const autoplay = url.searchParams.has('autoplay') ? url.searchParams.get('autoplay') : undefined;
    const defaultVersion = url.searchParams.has('version') ? `@${url.searchParams.get('version')}` : `@${versions[0]}`;
    const vhsVersion = url.searchParams.has('vhs') ? `@${url.searchParams.get('vhs')}` : undefined;
    const emeVersion = url.searchParams.has('eme') ? `@${url.searchParams.get('eme')}` : '@3.9.0';
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

    const scripts = [{
        type: 'js',
        url: `https://unpkg.com/video.js${defaultVersion}/dist/video.js`
    },
    {
        type: 'css',
        url: `https://unpkg.com/video.js${defaultVersion}/dist/video-js.css`
    },
    {
        type: 'js',
        url: `https://unpkg.com/videojs-contrib-eme${emeVersion}/dist/videojs-contrib-eme.js`
    }];

    if(vhsVersion){
        scripts.splice(1, 0, {
            type: 'js',
            url: `https://unpkg.com/@videojs/http-streaming${vhsVersion}/dist/videojs-http-streaming.js`
        });
    }

    loadator(scripts)
        .then((result) => {
            console.log('LOADATORATION SUCCEEDED', result);

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
                userActions: {
                    hotkeys: true
                },
            };
            const source = {
                src: mediaSource ? mediaSource : $('datalist option').value,
                type: mediaSource ? $('.resource__mime-type').value : 'application/x-mpegURL',
                keySystems: drmFinder(),
            };

            player = new videojs('player', options);

            player.eme();
            // FROM: https://www.deviantart.com/henflay/art/Captain-Atom-281685997
            // By: https://www.deviantart.com/henflay
            player.poster('https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/3cce611d-ff6e-4e94-a826-e1af3acde2ab/d4npib1-bc8051db-b938-41bd-8cc9-8112c9092a4c.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzNjY2U2MTFkLWZmNmUtNGU5NC1hODI2LWUxYWYzYWNkZTJhYlwvZDRucGliMS1iYzgwNTFkYi1iOTM4LTQxYmQtOGNjOS04MTEyYzkwOTJhNGMuanBnIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.Ai3KsicdMuK9Nvoj-WzY9sHOE22hwfaA0bq-KvOPfGE');
            player.src(source);

            if (autoplay) {
                player.autoplay(autoplay);
            }

            const { VhsHandler: { version = () => undefined } = {} } = videojs;
            const vhs = version() || videojs.HlsSourceHandler.VERSION
            const plugins = Object.values(videojs.getPlugins()).filter(plugin => plugin.VERSION).map((plugin) =>{
                console.log(plugin)
                return {[plugin.name] : plugin.VERSION}
            });

            $('.video-js-config').innerText = JSON.stringify({vhs, plugins}, null, 2);
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
        })
        .catch((error) => console.log('LOADATORATION ABSOLUT FAILED', error))
})();
