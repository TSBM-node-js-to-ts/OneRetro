
router.get("/test-worker", (req, res) => {
    const result = await callWorker("/api-health");
    res.json(result);
});