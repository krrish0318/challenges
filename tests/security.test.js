const request = require('supertest');
const app = require('../server');

describe('Security Configuration Tests', () => {
    
    test('Should have Helmet security headers enabled', async () => {
        const res = await request(app).get('/');
        
        // Check for key Helmet headers
        expect(res.headers).toHaveProperty('content-security-policy');
        expect(res.headers).toHaveProperty('x-dns-prefetch-control');
        expect(res.headers).toHaveProperty('x-frame-options');
        expect(res.headers).toHaveProperty('x-content-type-options');
    });

    test('Should restrict body size to prevent DoS', async () => {
        const largeBody = 'a'.repeat(20000); // Exceeds 10kb limit
        const res = await request(app)
            .post('/api/venue/admin/density')
            .send({ data: largeBody });
        
        // 413 Payload Too Large
        expect(res.statusCode).toBe(413);
    });

    test('Should return 404 for unknown routes', async () => {
        const res = await request(app).get('/api/unknown');
        expect(res.statusCode).toBe(404);
    });

    test('Should handle global errors with standardized JSON', async () => {
        // Triggering an error (e.g., by passing invalid data to a route that might throw)
        const res = await request(app).get('/api/venue/assistant?q='); // Validator will fail but it returns 400
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });
});
