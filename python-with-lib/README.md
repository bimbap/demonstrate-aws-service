# AWS Lambda — Python 3.12 with External Libraries (`boto3` & `requests`)

A practical demonstration of building and packaging an AWS Lambda function in **Python 3.12** utilizing both the native AWS SDK (`boto3`) and external third-party libraries (`requests`).

---

## 📁 Files in This Directory

| File | Description |
|---|---|
| [`lambda_function.py`](file:///m:/lks/task/demonstrates-material/lambda/python-with-lib/lambda_function.py) | Python handler demonstrating cold start tracking, structured JSON CloudWatch logging, Embedded Metric Format (EMF), and external HTTP requests. |
| [`requirements.txt`](file:///m:/lks/task/demonstrates-material/lambda/python-with-lib/requirements.txt) | Python dependency specification (`boto3`, `requests`). |
| [`events/event-valid.json`](file:///m:/lks/task/demonstrates-material/lambda/python-with-lib/events/event-valid.json) | Test event payload with external health check enabled. |
| [`events/event-error.json`](file:///m:/lks/task/demonstrates-material/lambda/python-with-lib/events/event-error.json) | Error simulation test event payload. |

---

## 📦 How to Package Third-Party Dependencies for AWS Lambda

Because `requests` is not built into the AWS Lambda Python runtime, it must either be packaged directly in the deployment `.zip` archive or provided via an **AWS Lambda Layer**.

### Method A: Direct Zip Deployment Package (Fastest for LKS)

```bash
# 1. Install dependencies into a local 'package' folder
pip install -r requirements.txt -t package/

# 2. Copy the handler into the package folder
cp lambda_function.py package/

# 3. Create the deployment zip archive
cd package
zip -r ../lambda-python-with-lib.zip .
cd ..

# 4. Deploy via AWS CLI (or upload zip via AWS Console)
aws lambda create-function \
  --function-name demo-python-lib \
  --runtime python3.12 \
  --role arn:aws:iam::<ACCOUNT_ID>:role/LabRole \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://lambda-python-with-lib.zip
```

### Method B: Using AWS Lambda Layers (Best Practice)
1. Zip dependencies into `python/lib/python3.12/site-packages/`.
2. Publish layer: `aws lambda publish-layer-version --layer-name requests-layer --zip-file fileb://layer.zip`.
3. Attach the layer to your Lambda function so your function code stays minimal!
