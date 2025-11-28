import express from 'express';
import reflectionService from '../services/reflectionService.js';

const router = express.Router();

function parseErrorStatus(error, defaultStatus = 500) {
    return error?.statusCode && Number.isInteger(error.statusCode)
        ? error.statusCode
        : defaultStatus;
}

router.get('/', (req, res) => {
    try {
        const reflections = await reflectionService.getAllReflections();
        res.status(200).json(reflections);
    } catch (error) {
        res
            .status(parseErrorStatus(error, 400))
            .json({ error: error.message || "회고를 조회하지 못했습니다." });
    }
});

module.exports = router;