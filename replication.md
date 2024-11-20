Запускаем три MongoDB с помощью docker-compose

```bash
docker-compose up -d 
```

Подключаемся к контейнеру
```bash
docker exec -it mongodb1 mongosh
```

Создаём набор реплик в командной оболочке mongosh
```bash
rs.initiate({_id: "rs0", members: [
{_id: 0, host: "mongodb1:27017"},
{_id: 1, host: "mongodb2:27018"},
{_id: 2, host: "mongodb3:27019"}
]})
```