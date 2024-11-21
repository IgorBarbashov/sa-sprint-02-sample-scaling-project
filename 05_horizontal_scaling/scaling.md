Запускаем APISIX Gateway
```bash
docker-compose up -d 
```

Определите IP
```bash
 docker inspect -f='{{.Name}} - {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $( docker ps -aq) | grep web
```
Результат - мои IP-адреса `172.19.0.3`, `172.19.0.4`

---

Вызываем Consul для регистрации сервисов (надо подставить свои ip-адреса, полученные на предыдущем шаге)
```bash
curl -D - "http://127.0.0.1:8500/v1/agent/service/register" -X PUT \
  -H "Content-Type: application/json" \
  -d '{
    "ID": "svc-a1",
    "Name": "svc-a",
    "Tags": ["sample_web_svc", "v1"],
    "Address": "'172.19.0.3'",
    "Port": 80,
    "Weights": {
      "Passing": 10,
      "Warning": 1
    }
  }'
  
  curl -D - "http://127.0.0.1:8500/v1/agent/service/register" -X PUT \
  -H "Content-Type: application/json" \
  -d '{
    "ID": "svc-a2",
    "Name": "svc-a",
    "Tags": ["sample_web_svc", "v1"],
    "Address": "'172.19.0.4'",
    "Port": 80,
    "Weights": {
      "Passing": 10,
      "Warning": 1
    }
  }'
```
В результате консоль выдаст
```md
"truetrue%"
```

Проверка регистрации непосредственно в Consul
```bash
curl "http://127.0.0.1:8500/v1/catalog/service/svc-a" | jq
```

<details>
<summary>Результат проверки регистрации</summary>

```json
[
  {
    "ID": "0b45a5ae-5f04-f978-5b2b-3e3ba699e227",
    "Node": "agent-one",
    "Address": "172.19.0.5",
    "Datacenter": "dc1",
    "TaggedAddresses": {
      "lan": "172.19.0.5",
      "lan_ipv4": "172.19.0.5",
      "wan": "172.19.0.5",
      "wan_ipv4": "172.19.0.5"
    },
    "NodeMeta": {
      "consul-network-segment": ""
    },
    "ServiceKind": "",
    "ServiceID": "svc-a1",
    "ServiceName": "svc-a",
    "ServiceTags": [
      "sample_web_svc",
      "v1"
    ],
    "ServiceAddress": "172.19.0.3",
    "ServiceTaggedAddresses": {
      "lan_ipv4": {
        "Address": "172.19.0.3",
        "Port": 80
      },
      "wan_ipv4": {
        "Address": "172.19.0.3",
        "Port": 80
      }
    },
    "ServiceWeights": {
      "Passing": 10,
      "Warning": 1
    },
    "ServiceMeta": {},
    "ServicePort": 80,
    "ServiceSocketPath": "",
    "ServiceEnableTagOverride": false,
    "ServiceProxy": {
      "Mode": "",
      "MeshGateway": {},
      "Expose": {}
    },
    "ServiceConnect": {},
    "CreateIndex": 73,
    "ModifyIndex": 73
  },
  {
    "ID": "0b45a5ae-5f04-f978-5b2b-3e3ba699e227",
    "Node": "agent-one",
    "Address": "172.19.0.5",
    "Datacenter": "dc1",
    "TaggedAddresses": {
      "lan": "172.19.0.5",
      "lan_ipv4": "172.19.0.5",
      "wan": "172.19.0.5",
      "wan_ipv4": "172.19.0.5"
    },
    "NodeMeta": {
      "consul-network-segment": ""
    },
    "ServiceKind": "",
    "ServiceID": "svc-a2",
    "ServiceName": "svc-a",
    "ServiceTags": [
      "sample_web_svc",
      "v1"
    ],
    "ServiceAddress": "172.19.0.4",
    "ServiceTaggedAddresses": {
      "lan_ipv4": {
        "Address": "172.19.0.4",
        "Port": 80
      },
      "wan_ipv4": {
        "Address": "172.19.0.4",
        "Port": 80
      }
    },
    "ServiceWeights": {
      "Passing": 10,
      "Warning": 1
    },
    "ServiceMeta": {},
    "ServicePort": 80,
    "ServiceSocketPath": "",
    "ServiceEnableTagOverride": false,
    "ServiceProxy": {
      "Mode": "",
      "MeshGateway": {},
      "Expose": {}
    },
    "ServiceConnect": {},
    "CreateIndex": 74,
    "ModifyIndex": 74
  }
]
```
</details>

---

Стандартный ключ для доступа к API `APISIX` — `edd1c9f034335f136f87ad84b625c8f1`

Проверка наличия `Consul` на `Apisix`
```bash
curl "http://127.0.0.1:9092/v1/discovery/consul/dump"| jq
```

<details>
<summary>Результат проверки</summary>

```json
{
  "services": {
    "svc-a": [
      {
        "host": "172.19.0.3",
        "weight": 1,
        "port": 80
      },
      {
        "host": "172.19.0.4",
        "weight": 1,
        "port": 80
      }
    ]
  },
  "config": {
    "servers": [
      "http://consul:8500"
    ],
    "timeout": {
      "wait": 60,
      "read": 2000,
      "connect": 2000
    },
    "keepalive": true,
    "sort_type": "origin",
    "token": "",
    "dump": {
      "expire": 2592000,
      "load_on_init": true,
      "path": "logs/consul.dump"
    },
    "weight": 1,
    "fetch_interval": 3
  }
}
```
</details>

---

Регистрация маршрута через `Consul`
```bash
curl "http://127.0.0.1:9180/apisix/admin/routes" -H 'X-API-KEY: edd1c9f034335f136f87ad84b625c8f1' -X PUT -d '
{
  "id": "consul-web-route",
  "uri": "/consul/web/*",
  "upstream": {
    "service_name": "svc-a",
    "discovery_type": "consul",
    "type": "roundrobin"
  }
}' | jq
```

<details>
<summary>Получаем результат</summary>

```json
{
  "key": "/apisix/routes/consul-web-route",
  "value": {
    "priority": 0,
    "update_time": 1732116533,
    "uri": "/consul/web/*",
    "status": 1,
    "id": "consul-web-route",
    "upstream": {
      "service_name": "svc-a",
      "hash_on": "vars",
      "discovery_type": "consul",
      "scheme": "http",
      "pass_host": "pass",
      "type": "roundrobin"
    },
    "create_time": 1732116533
  }
}

```
</details>

Получить список маршрутов для того, чтобы удостовериться, что всё работает
```bash
curl http://127.0.0.1:9180/apisix/admin/routes -H 'X-API-KEY: edd1c9f034335f136f87ad84b625c8f1' | jq
```

<details>
<summary>Вывод будет примерно таким (id могут отличаться)</summary>

```json
{
  "total": 1,
  "list": [
    {
      "key": "/apisix/routes/consul-web-route",
      "createdIndex": 16,
      "value": {
        "update_time": 1732116533,
        "create_time": 1732116533,
        "priority": 0,
        "status": 1,
        "id": "consul-web-route",
        "upstream": {
          "service_name": "svc-a",
          "hash_on": "vars",
          "pass_host": "pass",
          "type": "roundrobin",
          "discovery_type": "consul",
          "scheme": "http"
        },
        "uri": "/consul/web/*"
      },
      "modifiedIndex": 16
    }
  ]
}
```
</details>

---

Финальная проверка балансировки средствами `APISIX` и `Service Discovery` средствами `Consul`
```bash
curl -D - "http://127.0.0.1:9080/consul/web/"
```

---

При возникновении ошибок можно посмотреть логи всех контейнеров сразу

```bash
docker compose logs -f
```

---

Для остановки docker-контейнеров рекомендуется использовать команду

```bash
docker compose down -v 
```
в этом случай вместе удалением контейнера удаляются и смонтированные `volume` 
