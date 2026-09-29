/* ============================================================
   videos.js — единый список всех озвучек BohtanVoice
   Добавляй сюда новые видео — они автоматически появятся
   в избранном, поиске и на главной.
   ============================================================ */

const ALL_VIDEOS = [
    {
        id: 'video1',
        titleEn: 'Three Bogatyrs and the Princess of Egypt',
        titleRu: 'Три богатыря и Принцесса Египта',
        poster: 'poster1.jpg',
        url: 'video1.html',
        searchEn: 'three bogatyrs princess egypt adventure family animation',
        searchRu: 'три богатыря принцесса египта приключения семейный мультфильм'
    }
    // Новые видео добавляй сюда:
    // {
    //     id: 'video2',
    //     titleEn: '...',
    //     titleRu: '...',
    //     poster: 'poster2.jpg',
    //     url: 'video2.html',
    //     searchEn: '...',
    //     searchRu: '...'
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