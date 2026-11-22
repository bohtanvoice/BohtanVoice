/* ============================================================
   videos.js — единый список всех озвучек BohtanVoice
   Добавляй сюда новые видео — они автоматически появятся
   в избранном, поиске и на главной.
   ============================================================ */

const ALL_VIDEOS = [
    {
        id: 'video1',
        titleEn: 'The Croods',
        titleRu: 'Семейка Крудс',
        poster: 'poster1.jpg',
        url: 'video1.html',
        searchEn: 'the croods prehistoric family adventure comedy animation dreamworks',
        searchRu: 'семейка крудс доисторическая семья приключения комедия мультфильм dreamworks',

        /* Ссылки на видео (вставить, когда будут готовы) */
        trailer: '',      /* ← сюда ссылку на трейлер (Bunny Stream) */
        fullMovie: ''     /* ← сюда ссылку на полный мультфильм */
    }
    // Новые видео добавляй сюда:
    // {
    //     id: 'video2',
    //     titleEn: '...',
    //     titleRu: '...',
    //     poster: 'poster2.jpg',
    //     url: 'video2.html',
    //     searchEn: '...',
    //     searchRu: '...',
    //     trailer: '',
    //     fullMovie: ''
    // }
];

/* Хелпер: найти видео по id */
function getVideoById(id) {
    return ALL_VIDEOS.find(v => v.id === id) || null;
}

/* Хелпер: получить название на нужном языке */
function getVideoTitle(video, lang) {
    if (!video) return '';
    return lang === 'ru' ? video.titleRu : video.titleEn;
}