Запускаем три MongoDB с помощью docker-compose

```bash
docker-compose up -d 
```

Подключаемся к любой ноде
```bash
docker exec -it redis_1 bash
```

Выполняем команду для создания кластера
```bash
echo "yes" | redis-cli --cluster create   173.17.0.2:6379   173.17.0.3:6379   173.17.0.4:6379   173.17.0.5:6379   173.17.0.6:6379   173.17.0.7:6379   --cluster-replicas 1
```

Выполняем команду для получения информации о кластере
```bash
redis-cli cluster nodes 
```

Для остановки docker-контейнеров рекомендуется использовать команду
```bash
docker compose down -v 
```
в этом случай вместе удалением контейнера удаляются и смонтированные `volume` 
