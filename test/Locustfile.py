from locust import HttpLocust, TaskSet, task
import json, requests

##################################
# Constants and settings
##################################

LOGIN_URL = "/app/api/v1/auth/login"
APPLICATION_URL = "/app/api/v1/application"

USER_CREDENTIALS = { "email": "normal@ucla.edu", "password": "test1234" }
ADMIN_CREDENTIALS = { "email": "admin@ucla.edu", "password": "test1234" }


##################################
# Tasks setup
##################################

userToken = requests.post("http://localhost:8080%s"%(LOGIN_URL), json=USER_CREDENTIALS).json()["token"]
adminToken = requests.post("http://localhost:8080%s"%(LOGIN_URL), json=ADMIN_CREDENTIALS).json()["token"]


##################################
# Tasks
##################################

class UserTasks(TaskSet):
	@task
	def login(self):
		self.client.post(LOGIN_URL, json=USER_CREDENTIALS)

	@task
	def get_applications(self):
		r = self.client.get(APPLICATION_URL, headers={
			"Authorization": "Bearer %s"%(userToken),
		})

		for app in r.json()["applications"]:
			self.client.get("%s/%s"%(APPLICATION_URL, app["id"]), headers={
				"Authorization": "Bearer %s"%(userToken),
			})



##################################
# Benchmark
##################################

class Benchmark(HttpLocust):
	task_set = UserTasks
	min_wait = 5000
	max_wait = 15000
