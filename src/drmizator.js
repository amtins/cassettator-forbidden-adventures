const drmCompatibilityLog = [];
const hdcpCompatibilityLog = [];
const robustnessLevel = [
    { robustness: 'SW_SECURE_CRYPTO', level: 'L3' },
    { robustness: 'SW_SECURE_DECODE', level: 'L3' },
    { robustness: 'HW_SECURE_CRYPTO', level: 'L2' },
    { robustness: 'HW_SECURE_DECODE', level: 'L1' },
    { robustness: 'HW_SECURE_ALL', level: 'L1' },
];
const keySystems = ['com.widevine.alpha', 'com.microsoft.playready', 'com.apple.fps.1_0'];
const hdcpVersions = ['1.0', '1.1', '1.2', '1.3', '1.4', '2.0', '2.1', '2.2', '2.3'];
const videoCodecs = [
    { 'contentType': 'video/mp4;codecs="avc1.42800C"' },
    { 'contentType': 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"' },
    { 'contentType': 'video/mp4; codecs="avc1.58A01E, mp4a.40.2"' },
    { 'contentType': 'video/mp4; codecs="avc1.4D401E, mp4a.40.2"' },
    { 'contentType': 'video/mp4; codecs="avc1.64001E, mp4a.40.2"' },
    { 'contentType': 'video/mp4; codecs="avc1.64001E, mp4a.40.2"' },
    { 'contentType': 'video/mp4; codecs=av01.0.04M.08' },
    { 'contentType': 'video/mp4; codecs="av01.0.04M.08, mp4a.40.2"' },
    { 'contentType': 'video/mp4; codecs="av01.0.04M.08, opus"' },
    { 'contentType': 'video/webm' },
    { 'contentType': 'video/webm; codecs=vorbis' },
    { 'contentType': 'video/webm; codecs=vp8' },
    { 'contentType': 'video/webm; codecs=vp8.0' },
    { 'contentType': 'video/webm; codecs="vp8, vorbis"' },
    { 'contentType': 'video/webm; codecs=vp9' },
    { 'contentType': 'video/webm; codecs=vp9.0' },
    { 'contentType': 'video/webm; codecs=vp09.00.10.08' },
];
const config = [
    {
        'initDataTypes': [
            'cenc'
        ],
        'persistentState': 'optional',
        'distinctiveIdentifier': 'optional',
        'sessionTypes': [
            'temporary'
        ],
        'audioCapabilities': [
            {
                'robustness': 'SW_SECURE_CRYPTO',
                'contentType': 'audio/mp4;codecs="mp4a.40.2"'
            }
        ],
        videoCapabilities: videoCodecs
    }
];

const printDRM = (value) => {
    drmCompatibilityLog.push(value);
    $('.drm-compatibility').innerHTML = drmCompatibilityLog.sort().reverse().join('\n');
}

const printHDCP = (value) => {
    hdcpCompatibilityLog.push(value);
    $('.hdcp-compatibility').innerHTML = hdcpCompatibilityLog.join('\n');
}

const drmSecurityLevel = (keySystem, config, robustness, level) => {
    try {
        navigator
            .requestMediaKeySystemAccess(keySystem, config)
            .then((keySystemAccess) => {
                return keySystemAccess.createMediaKeys();
            })
            .then((mediaKeys) => {
                printDRM(`<span class='ok'>[OK] ${level} ${robustness}\t ${keySystem}</span>`);
            })
            .catch((e) => {
                printDRM(`<span class='ko'>[KO] ${level} ${robustness} ${keySystem}</span>`);
            });
    } catch (e) {
        console.log('no widevine support');
        console.log(e);
    }
};

const hdcpLevel = (keySystem, config, hdcpVersion) => {
    try {
        navigator
            .requestMediaKeySystemAccess(keySystem, config)
            .then((keySystemAccess) => {
                return keySystemAccess.createMediaKeys();
            })
            .then(async (mediaKeys) => {
                if (('getStatusForPolicy' in mediaKeys)) {
                    const status = await mediaKeys.getStatusForPolicy({ hdcpVersion });
                    console.log('STATUS', status);
                    if (status === 'usable') {
                        printHDCP(`<span class='ok'>[OK] HDPC v${hdcpVersion} compatible</span>`);
                        return;
                    }
                }
                return Promise.reject(`[KO] HDPC v${hdcpVersion} not compatible`);
            })
            .catch((e) => {
                if (typeof e === 'string') {
                    printHDCP(`<span class='ko'>${e}</span>`);
                    return;
                }
            });
    } catch (e) {
        console.log('HDCP not supported');
        console.log(e);
    }
};

(async () => {
    robustnessLevel.forEach(({ robustness, level }) => {
        config[0].videoCapabilities.forEach(vc => {
            vc.robustness = robustness;
        });

        keySystems.forEach(keySystem => {
            drmSecurityLevel(keySystem, config, robustness, level);
        });
    });

    hdcpVersions.forEach(hdcpVersion => {
        config[0].videoCapabilities[0].robustness = 'SW_SECURE_CRYPTO';

        hdcpLevel(keySystems[0], config, hdcpVersion);
    });
})();